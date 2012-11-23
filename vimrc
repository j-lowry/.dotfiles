" Must come first because it changes other options.
set nocompatible

silent! call pathogen#infect() 
silent! call pathogen#helptags()

" for powerline? 
set encoding=utf-8 

filetype plugin indent on " Turn on file type detection.
syntax enable " Turn on syntax highlighting.
set t_Co=256 " Terminal colours available

runtime macros/matchit.vim        " Load the matchit plugin.

" Text completion
if has("autocmd") && exists("+omnifunc")
  autocmd Filetype *
        \ if &omnifunc == "" |
        \   setlocal omnifunc=syntaxcomplete#Complete |
        \ endif
endif
set completeopt=longest,menuone
let g:SuperTabMappingBackward = '<tab>'
let g:SuperTabLongestEnhanced = 1
let g:SuperTabLongestHighlight = 1

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

" leader mappings
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
nmap <leader>swh  :topleft  vnew<cr>
nmap <leader>swl :botright vnew<cr>
nmap <leader>swk    :topleft  new<cr>
nmap <leader>swj  :botright new<cr>
" Split buffer
nmap <leader>sh   :leftabove  vnew<cr>
nmap <leader>sl  :rightbelow vnew<cr>
nmap <leader>sk     :leftabove  new<cr>
nmap <leader>sj   :rightbelow new<cr>

" Make
map <leader>mm :make<cr><cr>
" Quick save
nmap <leader>w :w!<cr>
" clear highlighting
nmap <space> <space>:noh<cr>
" spelling
nmap <silent> <leader>sp :set spell!<cr>
set spelllang=en_au

" disable automatic folding
set nofoldenable

" REVIEW: what do these do?
autocmd QuickFixCmdPost [^l]* nested cwindow
autocmd QuickFixCmdPost    l* nested lwindow

" Tags
map <leader>ct :silent! !ctags -R 2> /dev/null &<cr>:redraw!<cr>
set tags=./tags,/
map <C-\> :tab split<cr>:exec("tag ".expand("<cword>"))<cr>
map <A-]> :vsp <cr>:exec("tag ".expand("<cword>"))<cr>
" Taglist
let Tlist_Ctags_Cmd = "ctags"
let Tlist_WinWidth = 50
map <leader>l :TlistToggle<cr>

" Light and dark color switching
colorscheme zellner
nnoremap <silent> <leader>cs :exec "color " . ((g:colors_name == "zellner") ? "xoria256" : "zellner")<cr>

" Stop highlighting really long lines is SLOW
set synmaxcol=240

" Highlight long lines
highlight OverLength ctermbg=DarkGrey ctermfg=White
map <leader>80 :match OverLength /\%81v.\+/<cr>

" get out of editing mode
inoremap jj <Esc> 
inoremap jw <Esc>:w <cr>

" Drop to shell
map <leader>ba :shell<cr>

" Pasting
set pastetoggle=<leader>pt

" Mouse
" TODO: Change this to toggle mouse on/off
map <leader>mo :set mouse=a<cr>

" Toggle line numbers
map <leader>nm :set number!<cr>

" If there is a package file, enable npm test
if filereadable("package.json")
  map <leader>nt :!npm test<cr>
endif

" Git
map <leader>gs :Gstatus<cr>
map <leader>gc :Gcommit<cr>
map <leader>gp :!git push<cr>

""" Filetype Configurations

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

" Coffeescript
let coffee_make_options = '--print'
let g:tlist_coffee_settings = 'coffee;f:function;v:variable'
autocmd BufNewFile,BufRead *.coffee setlocal shiftwidth=2 expandtab
autocmd BufNewFile,BufRead *.coffee setlocal foldenable foldmethod=indent
autocmd BufWritePost *.coffee silent CoffeeMake! | cwindow | redraw!
map <leader>cc :CoffeeCompile<cr>
map <leader>cC :CoffeeCompile vertical<cr>


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
