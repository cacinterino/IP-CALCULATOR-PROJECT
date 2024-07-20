document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('class-button').addEventListener('click', getClass);
    document.getElementById('hosts-button').addEventListener('click', calculateForHosts);
    document.getElementById('subnets-button').addEventListener('click', calculateForSubnets);
});

function validateIP(ip) {
    const regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return regex.test(ip);
}

function getClass() {
    const ip = document.getElementById('ip-address').value;
    if (!validateIP(ip)) {
        document.getElementById('class-result').textContent = "Invalid IP address.";
        return;
    }

    const { ipClass, defaultSubnetMask, maxHosts, maxSubnets } = getClassDetails(ip);
    if (ipClass === 'Invalid') {
        document.getElementById('class-result').textContent = "Invalid IP address range for class determination.";
        return;
    }

    document.getElementById('class-result').innerHTML = `
        Class: ${ipClass}<br>
        Default Subnet Mask: ${defaultSubnetMask}<br>
        Maximum Hosts per Subnet: ${maxHosts}<br>
        Maximum Subnets: ${maxSubnets}
    `;
}

function calculateForHosts() {
    const ip = document.getElementById('ip-address').value;
    if (!validateIP(ip)) {
        alert("Invalid IP address.");
        return;
    }

    const numHosts = parseInt(document.getElementById('num-hosts').value, 10);
    if (isNaN(numHosts) || numHosts <= 0) {
        alert("Please enter a valid number of hosts.");
        return;
    }

    const { ipClass, maxHosts } = getClassDetails(ip);
    if (numHosts > maxHosts) {
        alert(`The number of hosts exceeds the maximum allowed for a Class ${ipClass} network. Maximum hosts: ${maxHosts}`);
        return;
    }

    const results = calculateSubnetsForHosts(ip, numHosts);
    displayResults(results);
}

function calculateForSubnets() {
    const ip = document.getElementById('ip-address').value;
    if (!validateIP(ip)) {
        alert("Invalid IP address.");
        return;
    }

    const numSubnets = parseInt(document.getElementById('num-subnets').value, 10);
    if (isNaN(numSubnets) || numSubnets <= 0) {
        alert("Please enter a valid number of subnets.");
        return;
    }

    const results = calculateSubnetsForSubnets(ip, numSubnets);
    displayResults(results);
}

function getClassDetails(ip) {
    const firstOctet = parseInt(ip.split('.')[0], 10);
    let ipClass = '';
    let defaultSubnetMask = '';
    let maxHosts = 0;

    if (firstOctet >= 1 && firstOctet <= 126) {
        ipClass = 'A';
        defaultSubnetMask = '255.0.0.0';
        maxHosts = Math.pow(2, 24) - 2; // 2^24 - 2 hosts
    } else if (firstOctet >= 128 && firstOctet <= 191) {
        ipClass = 'B';
        defaultSubnetMask = '255.255.0.0';
        maxHosts = Math.pow(2, 16) - 2; // 2^16 - 2 hosts
    } else if (firstOctet >= 192 && firstOctet <= 223) {
        ipClass = 'C';
        defaultSubnetMask = '255.255.255.0';
        maxHosts = Math.pow(2, 8) - 2; // 2^8 - 2 hosts
    } else {
        ipClass = 'Invalid';
    }

    return { ipClass, defaultSubnetMask, maxHosts };
}

function calculateSubnetsForHosts(ip, numHosts) {
    const borrowedBits = Math.ceil(Math.log2(numHosts + 2)); // Number of bits to borrow to accommodate the hosts
    const subnetMask = 32 - borrowedBits; // Calculate the new subnet mask
    const numSubnets = Math.pow(2, borrowedBits); // Calculate the number of subnets
    const subnets = generateSubnets(ip, numSubnets, subnetMask); // Generate subnets
    return { borrowedBits, numSubnets, subnetMask, subnets };
}

function calculateSubnetsForSubnets(ip, numSubnets) {
    const borrowedBits = Math.ceil(Math.log2(numSubnets)); // Number of bits to borrow to create the subnets
    const subnetMask = 32 - borrowedBits; // Calculate the new subnet mask
    const subnets = generateSubnets(ip, numSubnets, subnetMask); // Generate subnets
    return { borrowedBits, numSubnets, subnetMask, subnets };
}

function generateSubnets(ip, numSubnets, subnetMask) {
    const ipBinary = ipToBinary(ip); // Convert IP address to binary
    const subnets = [];
    const hostBits = 32 - subnetMask; // Number of host bits
    const increment = Math.pow(2, hostBits); // Calculate the increment for each subnet

    for (let i = 0; i < numSubnets; i++) {
        const networkAddressBinary = incrementBinary(ipBinary, increment * i); // Calculate network address
        const networkAddress = binaryToIp(networkAddressBinary);

        const firstHostBinary = incrementBinary(networkAddressBinary, 1); // Calculate first usable host address
        const firstHost = binaryToIp(firstHostBinary);

        const lastHostBinary = incrementBinary(networkAddressBinary, increment - 2); // Calculate last usable host address
        const lastHost = binaryToIp(lastHostBinary);

        const broadcastAddressBinary = incrementBinary(networkAddressBinary, increment - 1); // Calculate broadcast address
        const broadcastAddress = binaryToIp(broadcastAddressBinary);

        subnets.push({
            networkAddress,
            useableRange: `${firstHost} - ${lastHost}`,
            broadcastAddress
        });
    }

    return subnets;
}

function ipToBinary(ip) {
    return ip.split('.').map(octet => parseInt(octet, 10).toString(2).padStart(8, '0')).join('');
}

function binaryToIp(binary) {
    return binary.match(/.{1,8}/g).map(bin => parseInt(bin, 2)).join('.');
}

function incrementBinary(binary, increment) {
    const binaryNum = parseInt(binary, 2) + increment;
    return binaryNum.toString(2).padStart(32, '0');
}

function displayResults(data) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
        <h2>Results</h2>
        <div class="calc" style="font-weight: bolder; display: flex; flex-direction: row; padding: 15px; font-size:18px;">
        <p>No. of Borrowed Bits: ${data.borrowedBits}</p>
        <p>No. of Subnets: ${data.numSubnets}</p>
        <p>Subnet Mask: /${data.subnetMask}</p>
        </div>
        <h3 style="font-weight: 20px">All Subnets</h3>
        <table>
            <thead>
                <tr>
                    <th>Subnet #</th>
                    <th>Network Address</th>
                    <th>Range of Useable Host Addresses</th>
                    <th>Broadcast Address</th>
                </tr>
            </thead>
            <tbody>
                ${data.subnets.map((subnet, index) => `
                    <tr>
                        <td>${index}</td>
                        <td>${subnet.networkAddress}</td>
                        <td>${subnet.useableRange}</td>
                        <td>${subnet.broadcastAddress}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}
