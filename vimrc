" Must come first because it changes other options.
set nocompatible
filetype off
set rtp+=~/.vim/bundle/Vundle.vim
call vundle#begin()

" Vundle
Plugin 'VundleVim/Vundle.vim'
Plugin 'airblade/vim-gitgutter'
Plugin 'airblade/vim-rooter'
Plugin 'vim-airline/vim-airline'
Plugin 'vim-airline/vim-airline-themes'
Plugin 'digitaltoad/vim-jade'
Plugin 'jiangmiao/auto-pairs'
Plugin 'kien/ctrlp.vim'
Plugin 'lambdatoast/elm.vim'
Plugin 'majutsushi/tagbar'
Plugin 'mileszs/ack.vim'
Plugin 'pangloss/vim-javascript'
Plugin 'scrooloose/syntastic'
Plugin 'tomtom/tcomment_vim'
Plugin 'townk/vim-autoclose'
Plugin 'tpope/vim-endwise'
Plugin 'tpope/vim-fugitive'
Plugin 'tpope/vim-ragtag'
Plugin 'tpope/vim-rails'
Plugin 'tpope/vim-surround'
Plugin 'vim-scripts/AutoTag'
Plugin 'vim-scripts/simplefold'

" Auto complete
Plugin 'Shougo/neocomplete.vim'
let g:acp_enableAtStartup = 0
let g:neocomplete#enable_at_startup = 1
let g:neocomplete#enable_smart_case = 1
let g:neocomplete#sources#syntax#min_keyword_length = 3
inoremap <expr><TAB>  pumvisible() ? "\<C-n>" : "\<TAB>"
inoremap <expr><Space> pumvisible() ? neocomplete#close_popup() : "\<Space>"
" autocmd FileType css setlocal omnifunc=csscomplete#CompleteCSS
" autocmd FileType html,markdown setlocal omnifunc=htmlcomplete#CompleteTags
autocmd FileType javascript setlocal omnifunc=javascriptcomplete#CompleteJS
" autocmd FileType python setlocal omnifunc=pythoncomplete#Complete
" autocmd FileType xml setlocal omnifunc=xmlcomplete#CompleteTags
Plugin 'Shougo/neosnippet'
Plugin 'Shougo/neosnippet-snippets'
imap <C-k>     <Plug>(neosnippet_expand_or_jump)
smap <C-k>     <Plug>(neosnippet_expand_or_jump)
xmap <C-k>     <Plug>(neosnippet_expand_target)


" JavaScript
Plugin 'kchmck/vim-coffee-script'
" Plugin 'othree/javascript-libraries-syntax.vim'

" Puppet
Plugin 'rodjek/vim-puppet'
Plugin 'godlygeek/tabular'

call vundle#end()
syntax enable " Turn on syntax highlighting.
filetype plugin indent on " Turn on file type detection.
set t_Co=256 " Terminal colours available

runtime macros/matchit.vim        " Load the matchit plugin.

""" Plugin Configurations

" CtrlP
let g:ctrlp_switch_buffer = 0 " Disable buffer switching

" Airline
let g:airline_powerline_fonts = 1
let g:airline_theme = 'tomorrow'

" vim-javacript
let g:html_indent_inctags = "html,body,head,tbody"
let g:html_indent_script1 = "inc"
let g:html_indent_style1 = "inc"

" Syntastic
nmap <leader>ln :lnext<cr>
nmap <leader>lp :lprevious<cr>
let g:syntastic_enable_signs=1
let g:syntastic_error_symbol='✗'
let g:syntastic_warning_symbol='⚠'
" let g:syntastic_auto_loc_list=1
let g:syntastic_loc_list_height=5
" Checkers
let g:syntastic_javascript_checkers = ['eslint']
let g:syntastic_coffee_checkers = ['coffee']

set showcmd                       " Display incomplete commands.
set showmode                      " Display the mode you're in.
" Only update if needed ie. during macros
set lazyredraw

set backspace=indent,eol,start    " Intuitive backspacing.

set hidden                        " Handle multiple buffers better.

set wildmenu                      " Enhanced command line completion.
set wildmode=list:longest         " Complete files like a shell.
set wildignore+=*/bower_components/*,*/node_modules/*,*/.tmp/*,*/dist/*

set ignorecase                    " Case-insensitive searching.
set smartcase                     " But case-sensitive if expression contains a capital letter.

set number                        " Show line numbers.
set ruler                         " Show cursor position.
" Display the closing match eg. ()
set showmatch
set cursorline
set cursorcolumn
set listchars=eol:$,tab:>-,trail:~,extends:>,precedes:<
nnoremap <F3> :set list!<CR>

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

" Remember until the end of time
set history=1000

" Jump to column of marking by default
nnoremap ' `
nnoremap ` '

" leader mappings
let mapleader = "\<Space>"
let g:mapleader = "\<Space>"

" Tab mappings
map <leader>t :tabnew<cr>
map <leader>te :tabedit
map <leader>tc :tabclose<cr>
map <leader>to :tabonly<cr>
map <leader>tn :tabnext<cr>
map <leader>tp :tabprevious<cr>
map <leader>tf :tabfirst<cr>
map <leader>tl :tablast<cr>
map <leader>tm :tabmove

" Split window
nmap <leader>swh :topleft  vnew<cr>
nmap <leader>swl :botright vnew<cr>
nmap <leader>swk :topleft  new<cr>
nmap <leader>swj :botright new<cr>
" Split buffer
nmap <leader>sh :leftabove  vnew<cr>
nmap <leader>sl :rightbelow vnew<cr>
nmap <leader>sk :leftabove  new<cr>
nmap <leader>sj :rightbelow new<cr>

" Quick save
nmap <leader>w :w!<cr>
" clear highlighting
nmap <space> <space>:noh<cr>
" spelling
nmap <silent> <leader>sp :set spell!<cr>
set spelllang=en_au

" Enable folding, but with most folds open by default
set foldenable
set foldlevelstart=10
set foldnestmax=10

" REVIEW: what do these do?
autocmd QuickFixCmdPost [^l]* nested cwindow
autocmd QuickFixCmdPost    l* nested lwindow

" Replace unicode quot and apos in ERB files
autocmd BufReadPost *.erb silent! %s/&apos;/'/g
autocmd BufReadPost *.erb silent! %s/&quot;/"/g

" Tags
map <leader>ct :silent! !ctags -R . 2> /dev/null &<cr>:redraw!<cr>
map <leader>ctg :silent! !ctags -R --append --tag-relative=no -f ~/.tags `pwd` 2> /dev/null &<cr>:redraw!<cr>
set tags=./tags,tags,~/.tags
map <C-\> :tab split<cr>:exec("tag ".expand("<cword>"))<cr>
map <A-]> :vsp <cr>:exec("tag ".expand("<cword>"))<cr>
" Tagbar
nmap <F7> :TagbarToggle<CR>

" Drop to shell
map <leader>ba :shell<cr>

" Pasting
set pastetoggle=<F2>

" Mouse
" TODO: Change this to toggle mouse on/off
map <leader>mo :set mouse=a<cr>

" Toggle line numbers
map <leader>nm :set number!<cr>

" If there is a package file, enable npm test
if filereadable("package.json")
  map <leader>nt :!npm test<cr>
endif

" Search using ack
map <leader>a :Ack 

" Git
map <leader>gs :Gstatus<cr>
map <leader>gb :Gblame<cr>
map <leader>gc :Gcommit<cr>
map <leader>gp :!git push<cr>

""" Filetype Configurations

" Ruby
autocmd FileType ruby setlocal foldmethod=indent shiftwidth=2 tabstop=2
autocmd FileType ruby set omnifunc=rubycomplete#Complete

" Javascript
autocmd FileType javascript setlocal foldmethod=syntax shiftwidth=2 tabstop=2
autocmd FileType javascript set omnifunc=javascriptcomplete#CompleteJS
" autocmd FileType javascript setlocal makeprg=jslint\ %
" autocmd FileType javascript setlocal errorformat=%-P%f,
"                     \%A%>%\\s%\\?#%*\\d\ %m,%Z%.%#Line\ %l\\,\ Pos\ %c,
"                     \%-G%f\ is\ OK.,%-Q
" Coffeescript
let coffee_make_options = '--print'
let g:tlist_coffee_settings = 'coffee;f:function;v:variable'
autocmd BufNewFile,BufRead *.coffee setlocal shiftwidth=2
autocmd BufNewFile,BufRead *.coffee setlocal foldenable foldmethod=indent
autocmd BufNewFile,BufRead *.cson set ft=coffee
autocmd FileType json setlocal foldmethod=indent

" Python
autocmd FileType python setlocal foldmethod=indent shiftwidth=4 tabstop=4
autocmd FileType python set makeprg=pylint\ --reports=n\ --output-format=parseable\ %:p|cwindow
autocmd FileType python set errorformat=%f:%l:\ %m,%-G%.%#
autocmd FileType python set omnifunc=pythoncomplete#Complete

" HTML/CSS/LESS
autocmd FileType css setlocal foldmethod=indent shiftwidth=2 tabstop=2
autocmd FileType html set omnifunc=htmlcomplete#CompleteTags
autocmd FileType css set omnifunc=csscomplete#CompleteCSS
autocmd BufNewFile,BufRead *.less set filetype=css

" YAML
autocmd FileType yaml setlocal foldmethod=indent

" Text
autocmd BufNewFile,BufRead *.md,*.markdown setlocal spell

" Jenkins (Puppet) job templates
autocmd BufNewFile,BufRead *.xml.erb setlocal noeol binary expandtab

" Stop highlighting really long lines is SLOW
set synmaxcol=240

" Make gitgutter's column look nicer
highlight clear SignColumn

" Highlight long lines
set textwidth=80
set colorcolumn=+1
" Highlight trailing whitespace
match ErrorMsg '\s\+$'

" Esc is not Vim's friend
cnoremap jk <Esc>
inoremap jk <C-[>
" inoremap jw <C-[>:w <cr>

" set background=light
colorscheme Tomorrow
