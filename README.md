# Deploy to nomad

This action will deploy docker image to nomad.

## Usage

You can now use the action like following code.

```yaml
uses: toeverything/deploy-to-nomad@main
env:
  nomad-acl: ${{secrets.NOMAD_ACL_TOKEN}}
  cf-access-client-id: ${{secrets.CF_ACCESS_CLIENT_ID}}
  cf-access-client-secret: ${{secrets.CF_ACCESS_CLIENT_SECRET}}
with:
  nomad-domain: 'nomad-dev.affine.systems'
  job-id: 'Your job id & name'
  image-url: 'ghcr.io/toeverything/blocksuite-icons-preview:nightly-latest'
  static-port: 10022
  container-port: 3000
```

## Code in Main

> First, you'll need to have a reasonably modern version of `node` handy. This won't work with versions older than 9, for instance.

Install the dependencies

```bash
$ npm install
```

Build the typescript and package it for distribution

```bash
$ npm run build && npm run package
```

Run the tests :heavy_check_mark:

```bash
$ npm test

 PASS  ./index.test.js
  ✓ throws invalid number (3ms)
  ✓ wait 500 ms (504ms)
  ✓ test runs (95ms)

...
```

## Change action.yml

The action.yml defines the inputs and output for your action.

Update the action.yml with your name, description, inputs and outputs for your action.

See the [documentation](https://help.github.com/en/articles/metadata-syntax-for-github-actions)

## Publish to a distribution branch

Actions are run from GitHub repos so we will checkin the packed dist folder.

Then run [ncc](https://github.com/zeit/ncc) and push the results:

```bash
$ npm run package
$ git add dist
$ git commit -a -m "prod dependencies"
$ git push origin releases/v1
```

Note: We recommend using the `--license` option for ncc, which will create a license file for all of the production node modules used in your project.

Your action is now published! :rocket:

See the [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)
