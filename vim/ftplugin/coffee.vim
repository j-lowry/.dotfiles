autocmd BufNewFile,BufRead *.coffee set filetype=coffee
autocmd BufNewFile,BufRead *Cakefile set filetype=coffee
autocmd BufNewFile,BufRead *.coffeekup,*.ck set filetype=coffee
autocmd BufNewFile,BufRead *._coffee set filetype=coffee

autocmd BufRead,BufNewFile *.coffee setlocal shiftwidth=2 expandtab
autocmd BufRead,BufNewFile *.coffee setlocal foldmethod=indent nofoldenable

let coffee_make_options = '--print'

" The ! stops the jump to first error
autocmd BufWritePost *.coffee silent CoffeeMake! | cwindow | redraw!

" Key mappings
map <leader>mc :CoffeeCompile<CR>
map <leader>mC :CoffeeCompile vertical<CR>
map <leader>nt :!npm test<CR>
