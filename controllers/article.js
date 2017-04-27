const Article = require('mongoose').model('Article');

module.exports = {
    createGet: (req, res) => {
        res.render('article/create');
    },
    createPost: (req, res) => {

        let articleArgs = req.body;

        let errorMsg = '';

        if (!req.isAuthenticated()) {
            errorMsg = 'За да побликувате статия трябва да се логнете!'
        } else if (!articleArgs.title) {
            errorMsg = 'Вашата статия няма заглавие!'
        } else if (!articleArgs.content) {
            errorMsg = 'Вашата статия няма текст!'
        }

        if (errorMsg) {
            res.render('article/create', {
                error: errorMsg
            });
            return;
        }

        articleArgs.author = req.user.id;

        Article.create(articleArgs).then(article => {
            req.user.articles.push(article.id);
            req.user.save(err => {
                if (err) {
                    res.redirect('article/create', {
                        error: err.message
                    });
                } else {
                    res.redirect('/');
                }
            });
        });
    },

    details: (req, res) => {
        let id = req.params.id;

        Article.findById(id).populate('author').then(article => {
            res.render('article/details', article);
        });
    },

    editGet: (req, res) => {
        let id = req.params.id;

        if (!req.isAuthenticated()) {
            let returnUrl = `/article/edit${id}`;
            req.session.returnUrl = returnUrl;

            res.redirect('user/login');
            return;
        }


        Article.findById(id).then(article => {
            // req.user.isInRole('Admin').then(article => {
                // if(!isAdmin() && !req.user.isAuthor(article)) {
                //     res.redirect('/')
                //     return;
                // }
                res.render('article/edit', article);
            });
        // });
    //

    },

    editPost: (req, res) => {
        let id = req.params.id;

        let articleArgs = req.body;

        let errorMsg = '';
        if (!articleArgs.title) {
            errorMsg = 'Заглавието на статията е задължително!'
        } else if (!articleArgs.content) {
            errorMsg = 'Текста на статията е задължителен!'
        }

        if (errorMsg) {
            res.render('article/edit', {error: errorMsg})
        } else {
            Article.update({_id: id}, {$set: {title: articleArgs.title, content: articleArgs.content}})
                .then(updateStatus => {
                    res.redirect(`/article/details/${id}`);
                })
        }
    },

    deleteGet: (req, res) => {
        let id = req.params.id;

        if(!req.isAuthenticated()){
            let returnUrl = `/article/delete${id}`;
            req.session.returnUrl = returnUrl;

            res.redirect('user/login');
            return;
        }

        Article.findById(id).then(article => {

                res.render('article/delete', article);
            });

    },

    deletePost: (req, res) => {
        let id = req.params.id;
        Article.findOneAndRemove({_id: id}).populate(('author')).then(article => {
            let author = article.author;
            let index = author.articles.indexOf(article.id);

            if (index < 0) {
                let errorMsg = 'Статията не съществува!';
                res.render('article/delete', {error: errorMsg})
            } else {
                let count = 1;
                author.articles.splice(index, count);
                author.save().then((user) => {
                    res.redirect('/');
                });
            }
        })
    }

}
