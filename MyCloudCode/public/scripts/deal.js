$(function() {

    Parse.$ = jQuery;

    // Replace this line with the one on your Quickstart Guide Page
    Parse.initialize("eYJZf0smVo3qebzNpQsj90vOmJuSV8u0i2HdnDfw", "bCbz40aJB88n4GUNnvQIUBPOawNcmtu5eviWqpYP");

    var LoginView = Parse.View.extend({
            template: Handlebars.compile($('#login-tpl').html()),
            events: {
                'submit .form-signin': 'login'
            },
            login: function(e) {

                // Prevent Default Submit Event
                e.preventDefault();

                // Get data from the form and put them into variables
                var data = $(e.target).serializeArray(),
                    username = data[0].value,
                    password = data[1].value;

                // Call Parse Login function with those variables
                Parse.User.logIn(username, password, {
                    // If the username and password matches
                    success: function(user) {
                        blogRouter.navigate('admin', { trigger: true });
                    },
                    // If there is an error
                    error: function(user, error) {
                        console.log(error);
                    }
                });
            },
            render: function(){
                this.$el.html(this.template());
            }
        });
    var WelcomeView = Parse.View.extend({
            template: Handlebars.compile($('#welcome-tpl').html()),
            events: {
                'click .add-blog': 'add'
            },
            add: function(){
                var addDealView = new AddDealView();
                addDealView.render();
                $('.main-container').html(addDealView.el);
            },
            render: function(){
                var attributes = this.model.toJSON();
                this.$el.html(this.template(attributes));
            }
        });
    var AddDealView = Parse.View.extend({
            template: Handlebars.compile($('#add-tpl').html()),
            events: {
                'submit .form-add': 'submit'
            },
            submit: function(e){
                // Prevent Default Submit Event     
                e.preventDefault();
                // Take the form and put it into a data object
                var data = $(e.target).serializeArray();
                var dealImage = $('#dealImage')[0];
                var name = "dealImage.jpg";
                var parseFile = new Parse.File(name, dealImage);
                parseFile.save().then(function() {
                    // The file has been saved to Parse.
                    console.log(parseFile.url());
                }, function(error) {
                // The file either could not be read, or could not be saved to Parse.
                });
            },
            render: function(){
                this.$el.html(this.template()).find('textarea').wysihtml5();
            }
        });
    var EditBlogView = Parse.View.extend({
            template: Handlebars.compile($('#edit-tpl').html()),
            events: {
                'submit .form-edit': 'submit'
            },
            submit: function(e) {
                e.preventDefault();
                var data = $(e.target).serializeArray();
                this.model.update(data[0].value, $('textarea').val());
            },
            render: function(){
                var attributes = this.model.toJSON();
                this.$el.html(this.template(attributes));
            }
        }),
        BlogsAdminView = Parse.View.extend({
            template: Handlebars.compile($('#blogs-admin-tpl').html()),
            events: {
                'click .app-edit': 'edit'
            },
            edit: function(e){
                e.preventDefault();
                var href = $(e.target).attr('href');
                blogRouter.navigate(href, { trigger: true });
            },
            render: function() {
                var collection = { blog: this.collection.toJSON() };
                this.$el.html(this.template(collection));
            }
        }),
        BlogRouter = Parse.Router.extend({
        
            // Here you can define some shared variables
            initialize: function(options){
            },
            
            // This runs when we start the router. Just leave it for now.
            start: function(){
                Parse.history.start({pushState: true});
                this.navigate('admin', { trigger: true });
            },
                
            // This is where you map functions to urls.
            // Just add '{{URL pattern}}': '{{function name}}'
            routes: {
                'admin': 'admin',
                'login': 'login',
                'add': 'add',
                'edit/:id': 'edit'
            },
            
            admin: function() {
                // This is how you can current user in Parse
                var currentUser = Parse.User.current();

                if ( !currentUser ) {
                    // This is how you can do url rediect in JS
                    blogRouter.navigate('login', { trigger: true });

                } else {

                    var welcomeView = new WelcomeView({ model: currentUser });
                    welcomeView.render();
                    $('.main-container').html(welcomeView.el);
                }
            },
            login: function() {
                var loginView = new LoginView();
                loginView.render();
                $('.main-container').html(loginView.el);
            },
            add: function() {
                var addDealView = new AddDealView();
                    addDealView.render();
                    $('.main-container').html(addDealView.el);
            },
            edit: function(id) {
                var query = new Parse.Query(Blog);
                query.get(id, {
                    success: function(blog) {
                        var editBlogView = new EditBlogView({ model: blog });
                        editBlogView.render();
                        $('.main-container').html(editBlogView.el);
                    },
                    error: function(blog, error) {
                        console.log(error);
                    }
                });
            }

        }),
        blogRouter = new BlogRouter();
        
        blogRouter.start();

});