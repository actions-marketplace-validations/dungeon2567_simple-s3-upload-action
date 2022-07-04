const core = require('@actions/core');
const S3 = require('aws-sdk/clients/s3');
const fs = require('fs');
const path = require('path');
const klawSync = require('klaw-sync');
const { lookup } = require('mime-types');

const S3_ENDPOINT = core.getInput('S3_ENDPOINT', {
  required: true
});

const AWS_KEY_ID = core.getInput('AWS_ACCESS_KEY_ID', {
  required: true
});
const SECRET_ACCESS_KEY = core.getInput('AWS_SECRET_ACCESS_KEY', {
  required: true
});
const BUCKET = core.getInput('AWS_S3_BUCKET', {
  required: true
});
const SOURCE_DIR = core.getInput('SOURCE_DIR', {
  required: true
});
const DEST_DIR = core.getInput('DEST_DIR', {
  required: true
})

const spacesEndpoint = new aws.Endpoint(S3_ENDPOINT);

const s3 = new S3({
  endpoint: spacesEndpoint,
  accessKeyId: AWS_KEY_ID,
  secretAccessKey: SECRET_ACCESS_KEY
});
const objKey = DEST_DIR;
const paths = klawSync(SOURCE_DIR, {
  nodir: true
});

function upload(params) {
  return new Promise(resolve => {
    s3.upload(params, (err, data) => {
      if (err) core.error(err);
      core.info(`uploaded - ${data.Key}`);
      core.info(`located - ${data.Location}`);
      resolve(data.Location);
    });
  });
}
function run() {
  return Promise.all(
    paths.map(p => {
      const Key = p.path.replace(path.join(process.cwd(), SOURCE_DIR), objKey);
      const fileStream = fs.createReadStream(p.path);
      const params = {
        Bucket: BUCKET,
        ACL: 'public-read',
        Body: fileStream,
        Key,
        ContentType: lookup(p.path) || 'text/plain'
      };
      return upload(params);
    })
  );
}

run()
  .then(locations => {
    core.info(`object locations - ${locations}`);
    core.setOutput('object_locations', locations);
  })
  .catch(err => {
    core.error(err);
    core.setFailed(err.message);
  });
