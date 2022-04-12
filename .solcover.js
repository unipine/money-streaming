const skipFiles = ['']

module.exports = {
  providerOptions: {
    mnemonic: process.env.MNEMONIC,
    network_id: 1337,
  },
  skipFiles,
  istanbulFolder: './reports/coverage',
}
