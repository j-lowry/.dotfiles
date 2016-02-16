#!/bin/bash
# .setup.sh
# Copies dotfiles to the home directory

# variables
dir=~/.dotfiles                    # dotfiles (ie. this) directory
olddir=~/.dotfiles.old             # old dotfiles backup directory

# create dotfiles.old in homedir
echo "Removing previous backups in $olddir"
rm -rf $olddir
echo "Existing files will be backed-up to $olddir"
mkdir -p $olddir

# move any existing dotfiles and update
echo "Copying files from $dir to $HOME"
for file in `ls $dir`
do
  mv ~/.$file $olddir
  echo "Copying $dir/$file at ~/.$file"
  cp -r $dir/$file ~/.$file
done

# setup files
# Include Vundle
git clone https://github.com/VundleVim/Vundle.vim.git ~/.vim/bundle/Vundle.vim
# add git global ignore file
if [ -e `which git` ]
then
  git config --global core.excludesfile ~/.gitignore_global
fi

# fonts - fc-cache is from the fontconfig
fc-cache -vf ~/.fonts
