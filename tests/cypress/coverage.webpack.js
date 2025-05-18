module.exports = {
  module: {
    rules: [
      {
        test: /\.(ts|js)$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-typescript'],
            plugins: [['istanbul', { useBabelrc: false, include: ['./src'] }]],
          },
        },
        enforce: 'post',
        exclude: /node_modules|cypress\/support|cypress\/e2e|\\.spec\\.ts$|\\.cy\\.ts$/,
      },
    ],
  },
};
