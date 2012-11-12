" Must come first because it changes other options.
set nocompatible

filetype off 
silent! call pathogen#runtime_append_all_bundles()
silent! call pathogen#infect() 
silent! call pathogen#helptags()

" for powerline? 
set encoding=utf-8 

filetype plugin indent on         " Turn on file type detection.
syntax enable                     " Turn on syntax highlighting.
set ofu=syntaxcomplete#Complete   " Omni completion
set t_Co=256

runtime macros/matchit.vim        " Load the matchit plugin.

set showcmd                       " Display incomplete commands.
set showmode                      " Display the mode you're in.

set backspace=indent,eol,start    " Intuitive backspacing.

set hidden                        " Handle multiple buffers better.

set wildmenu                      " Enhanced command line completion.
set wildmode=list:longest         " Complete files like a shell.

set ignorecase                    " Case-insensitive searching.
set smartcase                     " But case-sensitive if expression contains a capital letter.

set number                        " Show line numbers.
set ruler                         " Show cursor position.

" Searching
set incsearch                     " Highlight matches as you type.
set hlsearch                      " Highlight matches.

set wrap                          " Turn on line wrapping.
set scrolloff=5                   " Show n lines of context around the cursor.

set title                         " Set the terminal's title

set visualbell                    " No beeping.

set nobackup                      " Don't make a backup before overwriting a file.
set nowritebackup                 " And again.
set directory=$HOME/.vim/tmp//,.  " Keep swap files in one location

set tabstop=2                    " Global tab width.
set shiftwidth=2                 " And again, related.
set expandtab                    " Use spaces instead of tabs

set laststatus=2                  " Show the status line all the time

" Leader mappings
let mapleader = ","
let g:mapleader = ","

" Tab mappings
map <leader>tt :tabnew<cr>
map <leader>te :tabedit
map <leader>tc :tabclose<cr>
map <leader>to :tabonly<cr>
map <leader>tn :tabnext<cr>
map <leader>tp :tabprevious<cr>
map <leader>tf :tabfirst<cr>
map <leader>tl :tablast<cr>
map <leader>tm :tabmove

" Split window
nmap <leader>swh  :topleft  vnew<CR>
nmap <leader>swl :botright vnew<CR>
nmap <leader>swk    :topleft  new<CR>
nmap <leader>swj  :botright new<CR>
" Split buffer
nmap <leader>sh   :leftabove  vnew<CR>
nmap <leader>sl  :rightbelow vnew<CR>
nmap <leader>sk     :leftabove  new<CR>
nmap <leader>sj   :rightbelow new<CR>

" Make
map <leader>mm :make<CR><CR>
" Quick save
nmap <leader>w :w!<cr>
" clear highlighting
nmap <space> <space>:noh<cr>
" spelling
nmap <silent> <leader>s :set spell!<cr>
set spelllang=en_au

" disable automatic folding
set nofoldenable

" Ruby
autocmd FileType ruby setlocal foldmethod=syntax
autocmd FileType ruby set omnifunc=rubycomplete#Complete

" Javascript
autocmd FileType javascript setlocal foldmethod=syntax shiftwidth=4 tabstop=4
autocmd FileType javascript set omnifunc=javascriptcomplete#CompleteJS
autocmd FileType javascript set makeprg=jslint\ %
autocmd FileType javascript set efm=%-P%f,
             \%E%>\ #%n\ %m,%Z%.%#Line\ %l\\,\ Pos\ %c,
             \%-G%f\ is\ OK.,%-Q

" Python
autocmd FileType python setlocal foldmethod=indent shiftwidth=4 tabstop=4
autocmd FileType python set makeprg=pylint\ --reports=n\ --output-format=parseable\ %:p|cwindow
autocmd FileType python set errorformat=%f:%l:\ %m,%-G%.%#
autocmd FileType python set omnifunc=pythoncomplete#Complete

" HTML/CSS
autocmd FileType css setlocal foldmethod=indent shiftwidth=2 tabstop=2
autocmd FileType html set omnifunc=htmlcomplete#CompleteTags
autocmd FileType css set omnifunc=csscomplete#CompleteCSS

" Data files
autocmd BufNewFile,BufRead *.json set ft=javascript

" Text
autocmd BufNewFile,BufRead *.md,*.markdown setlocal spell 

autocmd QuickFixCmdPost [^l]* nested cwindow
autocmd QuickFixCmdPost    l* nested lwindow

" Tags
set tags=./tags,tags
map <C-\> :tab split<CR>:exec("tag ".expand("<cword>"))<CR>
map <A-]> :vsp <CR>:exec("tag ".expand("<cword>"))<CR>
" Taglist
let Tlist_Ctags_Cmd = "ctags"
let Tlist_WinWidth = 50
map <Leader>l :TlistToggle<cr>

" Light and dark color switching
colorscheme slate
nnoremap <silent> <Leader>cc :exec "color " . ((g:colors_name == "slate") ? "morning" : "slate")<CR>

" get out of editing mode
inoremap jj <Esc> 
inoremap jw <Esc>:w <CR>

" Drop to shell
map <Leader>ss :shell<CR>

" Pasting
set pastetoggle=<Leader>pp 
set showmode

" stop vim from highlighting really long lines == SLOW
set synmaxcol=200
map <Leader>8 :match ErrorMsg '\%>80v.\+'<CR>

" Toggle line numbers
map <Leader>nm :set number!<cr>
