const { merge } = require("webpack-merge");
const path = require("path");

const isProd = process.env.npm_lifecycle_event === "build";
const isDev = process.env.npm_lifecycle_event === "start";

const BASE_DIR = path.join(__dirname, "fpfwagtailcommon", "curlify", "client");
const DIST_DIR = path.join(
  __dirname,
  "fpfwagtailcommon",
  "curlify",
  "static",
  "curlify",
  "js",
);

const common = {
  entry: {
    draftail_curlify: path.resolve(BASE_DIR, "draftail_curlify.js"),
  },

  output: {
    path: DIST_DIR,
    filename: "[name].js",
  },

  resolve: {
    extensions: [".js"],
    modules: ["node_modules"],
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        use: "babel-loader",
        include: [BASE_DIR],
      },
    ],
  },
};

if (isProd) {
  module.exports = merge(common, {
    mode: "production",
  });
} else {
  module.exports = merge(common, {
    mode: "development",
    devtool: "eval-source-map",
  });
}
