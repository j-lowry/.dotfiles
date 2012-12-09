# General
export EDITOR=vim
alias ls='ls -G'
alias ll='ls -al'

# Search history
function hgrep() { history|`which grep` $@|grep -v hgrep; }

# Get local settings
if [ -f ~/.bashrc ]; then
  . ~/.bashrc
fi

# Get local aliases
if [ -f ~/.bash_aliases ]; then
  . ~/.bash_aliases
fi
