const os = require('os');
const { spawn } = require('child_process');

function isPrivate172(address) {
	// 172.16.0.0 – 172.31.255.255
	const parts = address.split('.').map(Number);
	return parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31;
}

function pickBestLanIp() {
	const interfaces = os.networkInterfaces();
	const candidates = [];
	for (const [name, addrs] of Object.entries(interfaces)) {
		if (!addrs) continue;
		for (const addr of addrs) {
			if (addr.internal) continue;
			if (addr.family !== 'IPv4') continue;
			// Skip common virtual/VPN adapters by name heuristics
			const lower = name.toLowerCase();
			if (lower.includes('virtual') || lower.includes('vmware') || lower.includes('hyper') || lower.includes('tailscale') || lower.includes('zerotier') || lower.includes('loopback') || lower.includes('vEthernet'.toLowerCase()) || lower.includes('vpn')) {
				continue;
			}
			candidates.push({ name, address: addr.address });
		}
	}

	// Prefer 192.168.x.x, then 10.x.x.x, then 172.16-31.x.x
	const pref192 = candidates.find(c => c.address.startsWith('192.168.'));
	if (pref192) return pref192.address;
	const pref10 = candidates.find(c => c.address.startsWith('10.'));
	if (pref10) return pref10.address;
	const pref172 = candidates.find(c => isPrivate172(c.address));
	if (pref172) return pref172.address;
	// Fallback: any non-internal IPv4
	return candidates[0]?.address;
}

function start() {
	const ip = pickBestLanIp();
	if (ip) {
		process.env.REACT_NATIVE_PACKAGER_HOSTNAME = ip;
		console.log(`[start-lan-auto] Using LAN IP: ${ip}`);
	} else {
		console.warn('[start-lan-auto] Could not detect LAN IPv4. Expo will auto-detect.');
	}

	const args = ['expo', 'start', '--host', 'lan'];
	// Pass through extra flags provided to this script
	const extra = process.argv.slice(2);
	// If user did not specify cache flag, default to --clear for consistency
	if (!extra.includes('--clear')) args.push('--clear');
	const fullArgs = [...args, ...extra];

	const child = spawn('npx', fullArgs, {
		stdio: 'inherit',
		env: process.env,
		shell: true
	});

	child.on('exit', (code) => {
		process.exit(code ?? 0);
	});
}

start();


