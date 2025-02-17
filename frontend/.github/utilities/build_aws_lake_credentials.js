const fs = require("fs");

const file = `
[default]
aws_access_key_id=${process.env.AWS_ID}
aws_secret_access_key=${process.env.AWS_SECRET}
`;

fs.writeFileSync("./packages/indexer/credentials", file);
