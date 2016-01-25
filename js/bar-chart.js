'use strict';

( function ( window, $, d3 ) {

    window.addEventListener( 'load', function () {

        var BarChart = function ( options ) {

            var defaultOptions = {
                chartWidth: 960,
                chartHeight: 560
            };

            this.options = $.extend( defaultOptions, options );

            this.width = this.options.chartWidth - this.options.margin.left - this.options.margin.right;
            this.height = this.options.chartHeight - this.options.margin.top - this.options.margin.bottom;

            this.init();
        };

        $.extend( BarChart.prototype, {

            init: function () {
                this.x = d3.scale.ordinal().rangeRoundBands( [ 0, this.width ], .1 );
                this.y = d3.scale.linear().range( [ this.height, 0 ] );

                this.xAxis = d3.svg.axis().scale( this.x ).orient( 'bottom' );
                this.yAxis = d3.svg.axis().scale( this.y ).orient( 'left' ).ticks( 5 );

                this.svg = d3.select( '.js-BC-container' ).append( 'svg' )
                    .attr( 'width', this.width + this.options.margin.left + this.options.margin.right )
                    .attr( 'height', this.height + this.options.margin.top + this.options.margin.bottom )
                    .append( 'g' )
                    .attr( 'transform', 'translate(' + this.options.margin.left + ',' + this.options.margin.top + ')' );

                d3.json( '../data.json', this.render.bind( this ) );
            },

            render: function ( error, data ) {
                var self = this;

                if ( error ) throw error;

                this.x.domain( data.map( function ( d ) {
                    return d.hw;
                } ) );
                this.y.domain( [ 0, d3.max( data, function ( d ) {
                    return d.freq.high;
                } ) ] );

                this.svg.append( 'g' )
                    .attr( 'class', 'BC-container__axis' )
                    .attr( 'transform', 'translate(0,' + self.height + ')' )
                    .call( this.xAxis );

                this.svg.append( 'g' )
                    .attr( 'class', 'BC-container__axis' )
                    .call( this.yAxis )
                    .append( 'text' )
                    .attr( 'transform', 'rotate(-90)' )
                    .attr( 'y', 6 )
                    .attr( 'dy', '.71em' )
                    .style( 'text-anchor', 'end' )
                    .text( 'Amount of 4 grades' );

                this.svg.selectAll( '.BC-container__bar' )
                    .data( data )
                    .enter().append( 'rect' )
                    .attr( 'class', 'BC-container__bar' )
                    .attr( 'x', function ( d ) {
                        return self.x( d.hw );
                    } )
                    .attr( 'width', self.x.rangeBand() )
                    .attr( 'y', function ( d ) {
                        return self.y( d.freq.high );
                    } )
                    .attr( 'height', function ( d ) {
                        return self.height - self.y( d.freq.high );
                    } );
            }

        } );

        window.modules = window.modules || {};
        window.modules.BarChart = new BarChart( {
            margin: {
                top: 20,
                right: 20,
                bottom: 30,
                left: 40
            }
        } );

    } );

} )( window, jQuery, d3 );