export EDITOR=vim
function hgrep() { history|`which grep` $@|grep -v hgrep; }

# general
alias ls='ls -G'
alias ll='ls -al'
alias pythonserver='python -m SimpleHTTPServer'

# git
alias ga='git add'
alias gp='git push'
alias gpt='git push --tags'
alias gl='git log'
alias gs='git status'
alias gst='git stash'
alias gd='git diff'
alias gdc='git diff --cached'
alias gmv='git mv'
alias gme='git merge'
alias gcm='git commit -m'
alias gcma='git commit -am'
alias gb='git branch'
alias gc='git checkout'
alias gcb='git checkout -b'
alias grm='git rm'
alias gra='git remote add'
alias grr='git remote rm'
alias gpu='git pull'
alias gcl='git clone'
alias gr='git rebase'
alias gh='git hist'
alias gt='git tag'
alias gf='git fetch'
alias gft='git fetch --tags'

# Get local aliases/settings
if [ -f ~/.bashrc ]; then
  . ~/.bashrc
fi
