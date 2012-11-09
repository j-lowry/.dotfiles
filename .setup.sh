#!/bin/bash
# .setup.sh
# Copies dotfiles to the home directory

# variables
dir=~/.dotfiles                    # dotfiles directory
olddir=~/.dotfiles.old             # old dotfiles backup directory

# create dotfiles_old in homedir
echo "Existing files will be backed-up to $olddir"
mkdir -p $olddir

# move any existing dotfiles and update
echo "Copying files from $dir to $HOME"
for file in `ls $dir`
do
  mv ~/.$file $olddir
  echo "Symlinking $file to $HOME/.$file"
  ln -s $dir/$file ~/.$file
done
