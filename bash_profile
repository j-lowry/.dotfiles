
# General
export EDITOR=vim
set -o vi

# Search history
function hgrep() { history|`which grep` $@|grep -v hgrep; }
# Running processes
function psgrep() { ps -ef|`which grep` $@|grep -v hgrep; }

# Get aliases
if [ -f ~/.bash_aliases ]; then
  . ~/.bash_aliases
fi

# Login local configuration and settings
if [ -f ~/.bash_login ]; then
  . ~/.bash_login
fi

# Non-login local configuration and settings
if [ -f ~/.bashrc ]; then
  . ~/.bashrc
fi

