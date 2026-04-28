#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

xcodegen generate

xcodebuild -project BlocksMenuBar.xcodeproj \
  -scheme BlocksMenuBar \
  -configuration Release \
  -derivedDataPath build \
  -quiet \
  clean build

osascript -e 'tell application "Blocks" to quit' 2>/dev/null || true

SRC="build/Build/Products/Release/BlocksMenuBar.app"
DEST="/Applications/BlocksMenuBar.app"

rm -rf "$DEST"
cp -R "$SRC" "$DEST"

echo "Installed → $DEST"

if [[ "${OPEN_AFTER_INSTALL:-1}" == "1" ]]; then
  open "$DEST"
fi
