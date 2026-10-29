// Some networks can't resolve mongodb+srv:// addresses, so we use Google DNS.
// This used to be copy-pasted in 3 files; now it lives here only.
// To turn it off, put USE_PUBLIC_DNS=false in .env
const dns = require("dns");

if (process.env.USE_PUBLIC_DNS !== "false") {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
}
