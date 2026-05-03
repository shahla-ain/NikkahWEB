/**
 * ============================================================
 *  GENERATE ADMIN PASSWORD HASH
 *
 *  Run: node scripts/generate-hash.js
 *  Then copy the output hash into your .env file as:
 *    ADMIN_PASS_HASH=<paste hash here>
 *
 *  NEVER commit the plain password or .env to git.
 * ============================================================
 */

const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// Hide typed password (basic, works on most terminals)
process.stdout.write('Enter the admin password to hash: ');
process.stdin.setRawMode?.(true);

let pass = '';
process.stdin.on('data', async (ch) => {
  const char = ch.toString();
  if (char === '\n' || char === '\r' || char === '\u0004') {
    process.stdin.setRawMode?.(false);
    console.log('\n');
    if (!pass || pass.length < 8) {
      console.error('❌  Password must be at least 8 characters.');
      process.exit(1);
    }
    const hash = await bcrypt.hash(pass, 12);
    console.log('✅  Copy this hash into your .env file:\n');
    console.log(`ADMIN_PASS_HASH=${hash}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Never share or commit this hash to version control!');
    rl.close();
    process.exit(0);
  } else if (char === '\u0003') {
    process.exit(0);
  } else {
    pass += char;
    process.stdout.write('*');
  }
});
