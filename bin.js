#!/usr/bin/env node

const Hyperbeam = require('./')

if (process.argv.includes('-h') || process.argv.includes('--help')) {
  console.error('Usage: hyperbeam [passphrase]')
  console.error('')
  console.error('  Creates a 1-1 end-to-end encrypted network pipe.')
  console.error('  If a passphrase is not supplied, will create a new phrase and begin listening.')
  process.exit(1)
}

var beam
try {
  beam = new Hyperbeam(process.argv.slice(2).join(' '))
} catch (e) {
  if (e.constructor.name === 'PassphraseError') {
    console.error(e.message)
    console.error('(If you are attempting to create a new pipe, do not provide a phrase and hyperbeam will generate one for you.)')
    process.exit(1)
  } else {
    throw e
  }
}
console.error('[hyperbeam] Passphrase is:', beam.key)

beam.on('remote-address', function ({ host, port }) {
  if (!host) console.error('[hyperbeam] Could not detect remote address')
  else console.error('[hyperbeam] Joined the DHT - remote address is ' + host + ':' + port)
  if (port) console.error('[hyperbeam] Network is holepunchable \\o/')
})

beam.on('connected', function () {
  console.error('[hyperbeam] Success! Encrypted tunnel established to remote peer')
})

beam.on('end', () => beam.end())

process.stdin.pipe(beam).pipe(process.stdout)
if (typeof process.stdin.unref === 'function') process.stdin.unref()

process.once('SIGINT', () => {
  if (!beam.connected) closeASAP()
  else beam.end()
})

function closeASAP () {
  console.error('[hyperbeam] Shutting down beam...')

  const timeout = setTimeout(() => process.exit(1), 2000)
  beam.destroy()
  beam.on('close', function () {
    clearTimeout(timeout)
  })
}
