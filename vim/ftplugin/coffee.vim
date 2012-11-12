autocmd BufRead,BufNewFile *.coffe	set filetype=coffeescript
autocmd FileType coffeescript setlocal foldmethod=indent
autocmd FileType coffeescript setlocal shiftwidth=2 expandtab
autocmd BufWritePost *.coffee silent CoffeeMake! -b | cwindow | redraw!

" Settings
let coffee_compiler = '/usr/local/bin/coffee'
let coffee_make_options = '--print'

" Key mappings
map <leader>mc :CoffeeCompile<CR>
map <leader>nt :!npm test<CR>
