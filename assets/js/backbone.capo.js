/**
 *     Backbone.capo.js v0.0.3
 *
 *     (c) 2010-2013 Enrique Ramirez, wepow.
 *     Backbone.Capo may be freely distributed under the MIT license.
 */

var Capo = (function(Backbone, _, root, document, undefined) {
    'use strict';

    var Capo = {};

    Capo.extend = Backbone.Model.extend;
    Capo.vent   = _.extend({}, Backbone.Events);

    // Capo.Module
    // ===========
    Capo.Module = function() {
        this.initialize.apply(this, arguments);
    };
    Capo.Module.extend = Backbone.Model.extend;

    // Module methods
    // --------------
    _.extend(Capo.Module.prototype, {

        // Initialize
        initialize: function() {},

        // Build items
        build: function(constructors, newHome) {
            var builtItems = {},
                newIndex;

            newHome = newHome || constructors;

            _.each(this[constructors], function(Value, index) {
                newIndex = index.charAt(0).toLowerCase() + index.slice(1);
                builtItems[newIndex] = new Value();
            });

            if (!this[newHome]) {
                this[newHome] = {};
            }

            // Extending original views object
            _.extend(this[newHome], builtItems);

            Capo.vent.trigger('module:' + constructors + ':built');

            return this;
        },

        startRouter: function() {
            this.router = new this.Router();

            Capo.vent.trigger('module:router:init');

            return this;
        }
    });

    // Capo.Region
    // ===========
    Capo.Region = function(element) {
        var el      =   element,
            region  =   {},
            currentView,
            _closeView,
            _openView;

        _closeView = function(view) {
            if (view && view.close) {

                // Closing subviews
                // # TODO: Closing subviews should happen
                // on Backbone.view.close(); rather than here.
                //
                // Due to a lack of inspiration to find a solution
                // that does not end in an infinite loop, it iss here
                // for now.
                _.each(view.assigned, function(view) {
                    view.close();
                });

                view.close();
            }
        };

        _openView = function(view) {
            view.undelegateEvents();
            view.delegateEvents();
            view.render();

            $(el).html(view.el);

            if (view.onShow) {
                view.onShow();
            }
        };

        region.show = function(view) {

            if (view === currentView) {
                return;
            }

            _closeView(currentView);
            currentView = view;
            _openView(currentView);

            Capo.vent.trigger('region:show', this);

            return this;
        };

        region.close = function() {
            _closeView(currentView);
            currentView = null;

            Capo.vent.trigger('region:close', this);

            return this;
        };

        return region;
    };

    // Capo.View
    // =========
    Capo.View = Backbone.View.extend({

        // Backbone.View.close()
        // ---------------------
        // This method closes the view. It removes it from the DOM,
        // as well as it's events.
        close: function() {
            this.undelegateEvents();
            this.remove();

            Capo.vent.trigger('view:close', this);

            return this;
        },

        // Backbone.View.disable()
        // -----------------------
        // This method will disable the events of the View. If
        // a view.onDisable() function is present, it will also
        // be called. Useful for adding disable styles.
        disable: function() {
            this.undelegateEvents();

            if (this.onDisable) {
                this.onDisable();
            }

            Capo.vent.trigger('view:disabled', this);

            return this;
        },

        // Backbone.View.enable()
        // ----------------------
        // This method re-enables OR overrides the events tied to
        // this view. If a view.onEnable() function is present, it
        // will also be called. Useful to remove disabled styles.
        enable: function(events) {
            this.undelegateEvents();

            if (events) {
                this.delegateEvents(events);
            } else {
                this.delegateEvents();
            }

            if (this.onEnable) {
                this.onEnable();
            }

            Capo.vent.trigger('view:enabled', this);

            return this;
        },

        // Backbone.View.assigned
        // ----------------------
        // Array holding all assigned subviews. Useful when parent
        // view is unrendered to unbind it's events. Zombies are bad!
        assigned: [],

        // Backbone.View.assign()
        // ----------------------
        //
        // @param {string} selector             [CSS Selector of target embed]
        // @param {object} view                 [Backbone view object to be embedded]
        //
        // Embeds a subview within a view.
        assign: function(selector, view) {
            var selectors;

            if ( _.isObject(selector) ) {
                selectors = selector;
            } else {
                selectors = {};
                selectors[selector] = view;
            }

            if ( !selectors ) {return;}

            _.each(selectors, function(view, selector) {
                view.setElement( this.$(selector) ).render();

                if (view.onShow) {
                    view.onShow();
                }

                this.assigned.push(view);
            }, this);

            Capo.vent.trigger('view:assigned', {
                parent: this,
                assigned: view,
                parent_children: this.assigned
            });

            return this;
        }
    });

    return Capo;

})(Backbone, _, this, document);
