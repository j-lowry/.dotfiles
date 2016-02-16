# General
alias l='ls'
alias ll='ls -al'
alias rsyncssh='rsync --archive --compress --progress --rsh=ssh'
alias ctagsgo='ctags-exuberant -R *'
alias xclip='xclip -selection clipboard'

# Webserver
alias simplehttpserver='python -m SimpleHTTPServer'

# Other
alias be='bundle exec'
alias r='rails'
# Opens files matching an ack query in vim tabs
function vck() {
  vim -p `ack -l $@`
}

# SSH
# SOCKS proxy
# alias sigmatunnel='ssh -f -N -D 9999 rowan@iota.rookstudios.net'
# Port Proxy
# alias sigmatunnel='ssh -nNT -R 8000:localhost:8000 sigma.rookstudios.com'
alias sshec2='ssh -l ec2-user '
alias sshru='ssh -l rowan.udell '

# Git
alias ga='git add'
alias gap='git add -p'
alias gb='git branch'
alias gbl='git blame'
alias gc='git checkout'
alias gcb='git checkout -b'
alias gcp='git checkout -p'
alias gct='git checkout -t'
alias gcl='git clone'
alias gca='git commit -a'
alias gcm='git commit'
alias gcma='git commit -am'
alias gcmam='git commit --amend'
alias gcmm='git commit -m'
alias gcmv='git commit -v'
alias gcp='git cherry-pick'
alias gd='git diff'
alias gdc='git diff --cached'
alias gf='git fetch'
alias gft='git fetch --tags'
alias gh='git hist'
alias gl='git log'
alias gmv='git mv'
alias gme='git merge'
alias gmes='git merge --squash'
alias gp='git push'
alias gpp='git pull && git push'
alias gpt='git push --tags'
alias gpu='git pull'
alias gpuf='git pull --ff-only'
alias gpur='git pull --rebase'
alias gre='git rebase'
alias grei='git rebase --interactive'
alias grm='git rm'
alias gra='git remote add'
alias grr='git remote rm'
alias grv='git remote -v'
alias gs='git status'
alias gst='git stash'
alias gsub='git submodule'
alias gsubi='git submodule init'
alias gsubu='git submodule update'
alias gt='git tag'
alias gundo='git reset --soft HEAD~1' # Only for un-pushed commits

# Colours
Color_Off="\[\033[0m\]"       # Text Reset
Black="\[\033[0;30m\]"        # Black
Red="\[\033[0;31m\]"          # Red
Green="\[\033[0;32m\]"        # Green
Yellow="\[\033[0;33m\]"       # Yellow
Blue="\[\033[0;34m\]"         # Blue
Purple="\[\033[0;35m\]"       # Purple
Cyan="\[\033[0;36m\]"         # Cyan
White="\[\033[0;37m\]"        # White
# Bold
BBlack="\[\033[1;30m\]"       # Black
BRed="\[\033[1;31m\]"         # Red
BGreen="\[\033[1;32m\]"       # Green
BYellow="\[\033[1;33m\]"      # Yellow
BBlue="\[\033[1;34m\]"        # Blue
BPurple="\[\033[1;35m\]"      # Purple
BCyan="\[\033[1;36m\]"        # Cyan
BWhite="\[\033[1;37m\]"       # White
# Underline
UBlack="\[\033[4;30m\]"       # Black
URed="\[\033[4;31m\]"         # Red
UGreen="\[\033[4;32m\]"       # Green
UYellow="\[\033[4;33m\]"      # Yellow
UBlue="\[\033[4;34m\]"        # Blue
UPurple="\[\033[4;35m\]"      # Purple
UCyan="\[\033[4;36m\]"        # Cyan
UWhite="\[\033[4;37m\]"       # White
# Background
On_Black="\[\033[40m\]"       # Black
On_Red="\[\033[41m\]"         # Red
On_Green="\[\033[42m\]"       # Green
On_Yellow="\[\033[43m\]"      # Yellow
On_Blue="\[\033[44m\]"        # Blue
On_Purple="\[\033[45m\]"      # Purple
On_Cyan="\[\033[46m\]"        # Cyan
On_White="\[\033[47m\]"       # White
# High Intensty
IBlack="\[\033[0;90m\]"       # Black
IRed="\[\033[0;91m\]"         # Red
IGreen="\[\033[0;92m\]"       # Green
IYellow="\[\033[0;93m\]"      # Yellow
IBlue="\[\033[0;94m\]"        # Blue
IPurple="\[\033[0;95m\]"      # Purple
ICyan="\[\033[0;96m\]"        # Cyan
IWhite="\[\033[0;97m\]"       # White
# Bold High Intensty
BIBlack="\[\033[1;90m\]"      # Black
BIRed="\[\033[1;91m\]"        # Red
BIGreen="\[\033[1;92m\]"      # Green
BIYellow="\[\033[1;93m\]"     # Yellow
BIBlue="\[\033[1;94m\]"       # Blue
BIPurple="\[\033[1;95m\]"     # Purple
BICyan="\[\033[1;96m\]"       # Cyan
BIWhite="\[\033[1;97m\]"      # White
# High Intensty backgrounds
On_IBlack="\[\033[0;100m\]"   # Black
On_IRed="\[\033[0;101m\]"     # Red
On_IGreen="\[\033[0;102m\]"   # Green
On_IYellow="\[\033[0;103m\]"  # Yellow
On_IBlue="\[\033[0;104m\]"    # Blue
On_IPurple="\[\033[10;95m\]"  # Purple
On_ICyan="\[\033[0;106m\]"    # Cyan
On_IWhite="\[\033[0;107m\]"   # White

# Shortcuts
PathShort="\w"
PathFull="\W"
NewLine="\n"
Time24h="\t"
Date="\d"
Username="\u"
Command="\!"
Hostname="\h"
FQDN="\H"

# Get the git branch
alias branch="git branch 2> /dev/null | grep '*' | sed 's/* \(.*\)/\1/' 2> /dev/null"
# Get the timestamp
alias timestamp="date +'%H:%M:%S %a %d/%m/%y %Z%z %V %s'"

# Change the status depending on the state of the repo
# TODO: Fix colours for branch statuses eg. echo "$Green($(__git_ps1))"
function git_status {
  if [ "$(branch)" != "" ]; then
    # A git repository
    status=`git status --porcelain 2> /dev/null`
    if [[ -z $status ]]; then
      # No loclly modified files
      branch_status="✔"
    else
      branch_status="✘"
    fi
    echo "$(branch) $branch_status"
  fi
}

# ♖ Prompt
PS1=""
PS1="$PS1$Purple$Username$Purple@$Hostname "
PS1="$PS1$Blue\$(timestamp)$NewLine"
PS1="$PS1$Purple[$Yellow$Command$Purple] "
PS1="$PS1$Cyan$PathShort "
PS1="$PS1$Color_Off\$(git_status) "
PS1="$PS1$NewLine"
export PS1

# Vi mode bash
# ^l clear screen
bind -m vi-insert "\C-l":clear-screen
# ^p check for partial match in history
bind -m vi-insert "\C-p":dynamic-complete-history
# ^n cycle through the list of partial matches
bind -m vi-insert "\C-n":menu-complete
