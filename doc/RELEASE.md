# Steps to release a new version of noisy

## Update version info

Make sure the version information in `web/constants.ts` is up to date.

## Publish the new version

This is done in the project [`mooss.github.io`](https://github.com/mooss/mooss.github.io).

1. Use `make noisy`  (requires to setup a link to noisy).
2. If pertinent, prepare new scene in `noisy/${version_name}/scenes` (screenshot, URL and JSON, see previous published versions).
   It's not always necessary to publish whole new scenes, old scenes can be kept if they can be recreated faithfully in the new version.

## Update the [README examples](../README.md#examples)

Update all the `github.io` links to point to the new version and also update the images if necessary (if the scene could not be recreated faithfully).

## Update the [changelog](../CHANGELOG.md)

The changes for the new version must be added as a new section at the top.
[This script](../scripts/draft-changelog.bash) can be used to create a draft.

## Update the main branch

## Make the GitHub release

Can be done at this page: https://github.com/mooss/noisy/releases/new.

Use the version period and number as the release tag (e.g. `alpha-1`).
Copy the header of the changelog as the release title and the content of the changelog as the release notes.
Compile noisy with `make dist` and attach the binary.

## Update repository details

Change the website to the newly published version.
