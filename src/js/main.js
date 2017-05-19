import $ from "jquery";
import Mustache from 'mustache';
import Hammer from 'hammerjs';

import USERS from '../server/mock/users.json';

// TODO: add a mock for retrieving random messages

class DateApp {
    constructor(){
        this.users = [];
        this.conversations = [];
        this.activeUser = null;
        this.friends = [];

        // Bind the functions to the obj
        this.getTemplates = this.getTemplates.bind(this);
        this.getUsers = this.getUsers.bind(this);
        this.renderProfiles = this.renderProfiles.bind(this);
        this.toggleFriend = this.toggleFriend.bind(this);
        this.isFriend = this.isFriend.bind(this);
    }

    /**
     * Get the templates
     * @returns {Promise}
     * TODO: this should go into an API js file
     */
    getTemplates() {
        return new Promise((resolve) => {
            const index = fetch('./view/index.html').then((res) => res.text()),
                messages = fetch('./view/messages.html').then((res) => res.text()),
                conversation =  fetch('./view/components/conversation.html').then((res) => res.text()),
                header =  fetch('./view/components/header.html').then((res) => res.text()),
                profile =  fetch('./view/components/profile.html').then((res) => res.text());

            Promise.all([index, messages, conversation, header, profile])
                .then((response) => {
                    this.templates = Object.assign({}, {
                        pages: {
                            index: response[0],
                            messages: response[1],
                        },
                        partials: {
                            conversation: response[2],
                            header: response[3],
                            profile: response[4]
                        }
                    });
                    resolve('ok');
                });
        });
    }

    /**
     * Retrieve the users from a mock file
     * TODO: THIS SHOULD GO IN AN API JS FILE
     */
    getUsers() {
        // patch users before adding them
        this.users = USERS.map((item, key) => Object.assign({}, item, {
            active:(key === 0),
            isFriend: this.isFriend(item.id),
        }));
        // set the first user as active
        this.setActiveUser(this.users[0].id);
    }

    setActiveUser(id) {
        this.activeUser = this.users.find(user => parseInt(user.id) === parseInt(id));
    }

    /**
     * Toggle an user as a friend
     * @param id {integer}
     */
    toggleFriend(id) {
        const index = this.friends.indexOf(id);
        const i = this.users.findIndex(item => parseInt(item.id) === parseInt(id));
        if (index >= 0) {
            this.friends.splice(index, 1);
            this.users[i].isFriend = false;
        } else {
            this.friends.push(id);
            this.users[i].isFriend = true;
        }
    }

    /**
     * Check if the user is a friend
     * @param id
     * @returns {boolean}
     */
    isFriend(id) {
        return (this.friends.indexOf(id) >= 0);
    }


    // MUSTACHE RENDERING

    /**
     * Render the Profiles page
     */
    renderProfiles() {
        const template = this.templates.pages.index;
        const appWrapper = document.getElementById('app-wrapper');
        const partials = this.templates.partials;
        const data = {
            users: this.users,
            activeUser: this.activeUser,
        };
        appWrapper.innerHTML = Mustache
            .to_html(template, data, partials);
        this.addProfileActions();


        const swipeArea = document.getElementById('view-holder');
        const mc = new Hammer(swipeArea, {
            recognizers: [
                // RecognizerClass, [options], [recognizeWith, ...], [requireFailure, ...]
                [Hammer.Rotate],
                [Hammer.Pan],
                [Hammer.Pinch, { enable: false }, ['rotate']],
                [Hammer.Swipe,{ direction: Hammer.DIRECTION_HORIZONTAL }],
            ]
        });

        mc.on("pan", (ev) => {
            console.log(ev);

            if(ev.direction === 4 && ev.isFinal) {
                //PANS right
                if($('.profile.active').prev().length !== 0) {
                    $('.profile.active').removeClass('active').prev().addClass('active');
                    this.setActiveUser($('.profile.active').attr('data-id'));
                }
            } else if (ev.direction === 2 && ev.isFinal) {
             // PANS left
                if($('.profile.active').next().length !== 0) {
                    $('.profile.active').removeClass('active').next().addClass('active');
                    this.setActiveUser($('.profile.active').attr('data-id'));
                }
            }
        });

    }


    /**
     * Render the Conversations page
     */
    renderConversation() {
        const template = this.templates.pages.messages;
        const appWrapper = document.getElementById('app-wrapper');
        const partials = this.templates.partials;
        const data = {
            user: this.activeUser,
            messages: this.recoverConversation(this.activeUser.id),
        };
        appWrapper.innerHTML = Mustache.render(template, data, partials);
        this.addConversationActions();
    }

    /**
     * Recover the conversation of a certain user
     * @param id
     * @returns {object}
     */
    recoverConversation(id) {
        if (this.conversations.find(item => item.id === id) === undefined) {
            this.conversations.push({
                id,
                message: [{
                    msg: this.constructor.generateRandomMessage(),
                    owner: true,
                }],
            });
        }
        return this.conversations.find(item => item.id === id);
    }

    /**
     * Add a new message to the local database
     * @param id
     * @param newMsg
     */
    addMessage(id, newMsg) {
        const i = this.conversations
            .findIndex(item => parseInt(item.id) === parseInt(id));
        this.conversations[i].message.push({
            msg: newMsg,
            owner: false,
        });
    }

    static generateRandomMessage() {
        return 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. A alias amet at deleniti distinctio eligendi eum explicabo fugit hic ipsam ipsum laboriosam modi, molestiae, natus nihil nulla optio ratione sed!';
    }

    // ADD ACTIONS


    /**
     * Add actions to the Profile page
     */
    addProfileActions() {

        const PROFILE = $('.profile');
        /**
         * Add as a friend
         */
        PROFILE.on('click', '.profile__add-btn', (el) => {
            $('.profile.active').toggleClass('_friend');
            this.toggleFriend($(el.target).attr('data-id'));
        });

        /**
         * Go to user conversation
         */
        PROFILE.on('click', '.profile__img', () => {
            this.renderConversation();
        });
    }

    /**
     * Add actions to the conversation page
     */
    addConversationActions() {
        /**
         * Optimize the code a bit
         */
        const FORM = $('.form-add-message');
        const CONVERSATION = $('.conversation');

        /**
         * Handle the click on the back button
         */
        CONVERSATION.on('click', '.btn__back, .conversation__user-img', function() {
            dateApp.renderProfiles();
        });


        /**
         * Handle events on the textarea
          */
        CONVERSATION.on('keyup', '.conversation__input', (ev) => {
            // get computed styles
            let style = ev.target.currentStyle || window.getComputedStyle(ev.target);
            let boxSizing = (style.boxSizing === 'border-box') ? parseInt(style.borderBottomWidth, 10) + parseInt(style.borderTopWidth, 10) : 0;
                // Resize the textarea
                ev.target.style.height = '';
                ev.target.style.height = (ev.target.scrollHeight + boxSizing) + 'px';

            if(ev.keyCode === 13) {
                FORM.submit();
            }
        });

        /**
         * Handle the submitting of the form
         */
        FORM.on('submit', (ev) => {
            const id = $(ev.target).attr('data-id');
            const newMsg = $('.conversation__input').val();
            if (newMsg.trim() !== '') {
                this.addMessage(id, newMsg);
            }
            this.renderConversation();
        });
    }

    /**
     * Call this function if you want to init the app
     */
    initApp() {
        this.getTemplates().then(() => {
            this.getUsers();
            this.renderProfiles();
        });
    }
}
const dateApp = new DateApp();
dateApp.initApp();
