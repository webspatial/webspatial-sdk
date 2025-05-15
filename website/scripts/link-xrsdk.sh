#!/usr/bin/env bash
# scripts/link-xrsdk.sh

# 1) If ./XRSDK already exists, do nothing and exit successfully.
if [ -d "./XRSDK" ]; then
	echo "./XRSDK already exists; skipping link."
	exit 0
fi

# 2) Determine source directory: prefer uppercase XRSDK, else lowercase xrsdk.
if [ -d "../XRSDK" ]; then
	SRC="../XRSDK"
elif [ -d "../xrsdk" ]; then
	SRC="../xrsdk"
else
	echo "No sibling XRSDK/xrsdk folder found; skipping link."
	exit 0
fi

# 3) Remove any leftover XRSDK folder or symlink (cross-platform)
npx rimraf XRSDK # remove old link or folder

# 4) Create a symbolic link from ./XRSDK to the detected source
ln -s "$SRC" XRSDK # create symlink
echo "Linked $SRC into ./XRSDK"

exit 0
