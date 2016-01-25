'use strict';

( function ( window, $ ) {

    window.addEventListener( 'load', function () {

        var Toggle = function ( options ) {

            var defaultOptions = {
                delay: 1000
            };

            this.options = $.extend( defaultOptions, options );

            this.init();
        };

        $.extend( Toggle.prototype, {

            init: function () {
                this.bindEvents();
            },

            bindEvents: function() {
                this.options.easyButton.addEventListener( 'click', this.onButtonClick.bind( this ) );
                this.options.cuteButton.addEventListener( 'click', this.onButtonClick.bind( this ) );
            },

            onButtonClick: function() {
                var self = this,
                    isChecked = document.querySelector( 'input[type="checkbox"]:checked' );

                if ( isChecked ) {
                    setTimeout( function() { window.location.href = self.options.cuteUrl }, this.options.delay );
                } else {
                    setTimeout( function() { window.location.href = self.options.easyUrl }, this.options.delay );
                }
            }

        } );

        window.modules = window.modules || {};
        window.modules.Toggle = new Toggle( {
            easyButton: document.querySelector( '.js-BC-toggle__easyButton' ),
            cuteButton: document.querySelector( '.js-BC-toggle__cuteButton' ),
            easyUrl: 'view/bar-chart.html',
            cuteUrl: 'view/layout-chart.html'
        } );

    } );

} )( window, jQuery );