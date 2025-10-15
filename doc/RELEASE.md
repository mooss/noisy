# Steps to release a new version of noisy

## Update version info

Make sure the version information in `web/constants.ts` is up to date.

## Publish the website

This is done in the project [`mooss.github.io`](https://github.com/mooss/mooss.github.io).

1. Use `make noisy`  (requires to setup a link to noisy).
2. If pertinent, prepare new scene in `noisy/${version_name}/scenes` (screenshot, URL and JSON, see previous published versions).
   It's not always necessary to publish whole new scenes, old scenes can be kept if they can be recreated faithfully in the new version.

## Update the [README examples](../README.md#examples-click-to-open-scene)

Update all the `github.io` links to point to the new version and also update the images if necessary (if the scene could not be recreated faithfully).
Make sure the links work and that their scene is matches the image preview.

## Update the [changelog](../CHANGELOG.md)

The changes for the new version must be added as a new section at the top.
[This script](../scripts/draft-changelog.bash) can be used to create a draft.

## Update the main branch

## Make the GitHub release

Can be done at [this page](https://github.com/mooss/noisy/releases/new).

Use the version period and number as the release tag (e.g. `alpha-1`).
Copy the header of the changelog as the release title and the content of the changelog as the release notes.
Compile noisy with `make dist` and attach the binary (`build/noisy-serve`).

## Add the commit hash to the latest changelog entry

## Re-publish the website

In `mooss.github.io`, use `make noisy` to recompile the latest version and don't forget to update `noisy/versions.yaml`.
This recompilation will update the footer with the correct commit hash.
Verify the example links in the README once again.

## Update repository details

Change the website link to point to the newly published version.
