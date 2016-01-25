'use strict';

( function ( window, $, d3 ) {

    window.addEventListener( 'load', function () {

        var LayoutChart = function ( options ) {

            var defaultOptions = {
                dashboardEl: '.js-LC-container',
                barColor: '#39C2D7'
            };

            this.options = $.extend( defaultOptions, options );

            this.init();
        };

        $.extend( LayoutChart.prototype, {

            init: function () {
                d3.json( '../data.json', this.createDashboard.bind( this ) );
            },

            createDashboard: function ( error, data ) {
                var self = this;

                if ( error ) throw error;

                this.options.frequencyData = data;

                // compute total for each state.
                this.options.frequencyData.forEach( function ( d ) {
                    d.total = d.freq.low + d.freq.mid + d.freq.high;
                } );

                // calculate total frequency by segment for all state.
                this.tF = [ 'low', 'mid', 'high' ].map( function ( d ) {
                    return {
                        type: d,
                        freq: d3.sum( self.options.frequencyData.map( function ( t ) {
                            return t.freq[ d ];
                        } ) )
                    };
                } );

                // calculate total frequency by state for all segment.
                this.sF = this.options.frequencyData.map( function ( d ) {
                    return [ d.hw, d.total ];
                } );

                // calculate color for pie-chat segment.
                this.calculateColor = function( color ) {
                    return { low: '#D6385B', mid: '#F1FF5B', high: '#A3C644' }[ color ];
                };

                this.hG = this.createHistogram( this.sF );
                this.pC = this.createPieChart( this.tF );
                this.leg = this.createLegend( this.tF );
            },

            createHistogram: function ( fD ) {
                var self = this;

                this.hG = {};
                var hGDim = { t: 60, r: 0, b: 30, l: 0 };

                hGDim.w = 860 - hGDim.l - hGDim.r;
                hGDim.h = 460 - hGDim.t - hGDim.b;

                // create svg for histogram.
                var hGsvg = d3.select( this.options.dashboardEl ).append( 'svg' )
                    .attr( 'width', hGDim.w + hGDim.l + hGDim.r )
                    .attr( 'height', hGDim.h + hGDim.t + hGDim.b ).append( 'g' )
                    .attr( 'transform', 'translate(' + hGDim.l + ',' + hGDim.t + ')' );

                // create function for x-axis mapping.
                var x = d3.scale.ordinal().rangeRoundBands( [ 0, hGDim.w ], 0.1 )
                    .domain( fD.map( function ( d ) {
                        return d[ 0 ];
                    } ) );

                // add x-axis to the histogram svg.
                hGsvg.append( 'g' ).attr( 'class', 'LC-container__axis' )
                    .attr( 'transform', 'translate(0,' + hGDim.h + ')' )
                    .call( d3.svg.axis().scale( x ).orient( 'bottom' ) );

                // create function for y-axis map.
                var y = d3.scale.linear().range( [ hGDim.h, 0 ] )
                    .domain( [ 0, d3.max( fD, function ( d ) {
                        return d[ 1 ];
                    } ) ] );

                // create bars for histogram to contain rectangles and freq labels.
                var bars = hGsvg.selectAll( '.js-LC-histogram__bar' ).data( fD ).enter()
                    .append( 'g' ).attr( 'class', 'LC-histogram__bar js-LC-histogram__bar' );

                // create the rectangles.
                bars.append( 'rect' )
                    .attr( 'x', function ( d ) {
                        return x( d[ 0 ] );
                    } )
                    .attr( 'y', function ( d ) {
                        return y( d[ 1 ] );
                    } )
                    .attr( 'width', x.rangeBand() )
                    .attr( 'height', function ( d ) {
                        return hGDim.h - y( d[ 1 ] );
                    } )
                    .attr( 'fill', this.options.barColor )
                    .on( 'mouseover', mouseover )// mouseover is defined below.
                    .on( 'mouseout', mouseout );// mouseout is defined below.

                // create the frequency labels above the rectangles.
                bars.append( 'text' ).text( function ( d ) {
                    return d3.format( ',' )( d[ 1 ] )
                } )
                    .attr( 'x', function ( d ) {
                        return x( d[ 0 ] ) + x.rangeBand() / 2;
                    } )
                    .attr( 'y', function ( d ) {
                        return y( d[ 1 ] ) - 5;
                    } )
                    .attr( 'text-anchor', 'middle' );

                // utility function to be called on mouseover.
                function mouseover( d ) {
                    // filter for selected state.
                    var st = self.options.frequencyData.filter( function ( s ) {
                            return s.hw == d[ 0 ];
                        } )[ 0 ],
                        nD = d3.keys( st.freq ).map( function ( s ) {
                            return { type: s, freq: st.freq[ s ] };
                        } );

                    // call update functions of pie-chart and legend.
                    self.pC.update( nD );
                    self.leg.update( nD );
                }

                // utility function to be called on mouseout.
                function mouseout( d ) {
                    // reset the pie-chart and legend.
                    self.pC.update( self.tF );
                    self.leg.update( self.tF );
                }

                // create function to update the bars. This will be used by pie-chart.
                this.hG.update = function ( nD, color ) {
                    // update the domain of the y-axis map to reflect change in frequencies.
                    y.domain( [ 0, d3.max( nD, function ( d ) {
                        return d[ 1 ];
                    } ) ] );

                    // attach the new data to the bars.
                    var bars = hGsvg.selectAll( '.js-LC-histogram__bar' ).data( nD );

                    // transition the height and color of rectangles.
                    bars.select( 'rect' ).transition().duration( 500 )
                        .attr( 'y', function ( d ) {
                            return y( d[ 1 ] );
                        } )
                        .attr( 'height', function ( d ) {
                            return hGDim.h - y( d[ 1 ] );
                        } )
                        .attr( 'fill', color );

                    // transition the frequency labels location and change value.
                    bars.select( 'text' ).transition().duration( 500 )
                        .text( function ( d ) {
                            return d3.format( ',' )( d[ 1 ] )
                        } )
                        .attr( 'y', function ( d ) {
                            return y( d[ 1 ] ) - 5;
                        } );
                };

                return this.hG;

            },

            createPieChart: function ( pD ) {
                var self = this;

                this.pC = {};
                var pieDim = { w: 250, h: 250 };
                pieDim.r = Math.min( pieDim.w, pieDim.h ) / 2;

                // create svg for pie chart.
                var piesvg = d3.select( this.options.dashboardEl ).append( 'svg' )
                    .attr( 'width', pieDim.w ).attr( 'height', pieDim.h ).append( 'g' )
                    .attr( 'transform', 'translate(' + pieDim.w / 2 + ',' + pieDim.h / 2 + ')' )
                    .attr( 'class', 'LC-pieCart' );

                // create function to draw the arcs of the pie slices.
                var arc = d3.svg.arc().outerRadius( pieDim.r - 10 ).innerRadius( 0 );

                // create a function to compute the pie slice angles.
                var pie = d3.layout.pie().sort( null ).value( function ( d ) {
                    return d.freq;
                } );

                // draw the pie slices.
                piesvg.selectAll( 'path' ).data( pie( pD ) ).enter().append( 'path' ).attr( 'd', arc )
                    .each( function ( d ) {
                        this._current = d; // this points on every pie <path> segment in turn.
                    } )
                    .style( 'fill', function ( d ) {
                        return self.calculateColor( d.data.type );
                    } )
                    .on( 'mouseover', mouseover ).on( 'mouseout', mouseout );

                // create function to update pie-chart. This will be used by histogram.
                this.pC.update = function ( nD ) {
                    piesvg.selectAll( 'path' ).data( pie( nD ) ).transition().duration( 500 )
                        .attrTween( 'd', arcTween );
                };
                // utility function to be called on mouseover a pie slice.
                function mouseover( d ) {
                    // call the update function of histogram with new data.
                    self.hG.update( self.options.frequencyData.map( function ( v ) {
                        return [ v.hw, v.freq[ d.data.type ] ];
                    } ), self.calculateColor( d.data.type ) );
                }

                // utility function to be called on mouseout a pie slice.
                function mouseout( d ) {
                    // call the update function of histogram with all data.
                    self.hG.update( self.options.frequencyData.map( function ( v ) {
                        return [ v.hw, v.total ];
                    } ), self.options.barColor );
                }

                // animating the pie-slice requiring a custom function which specifies how the intermediate paths should be drawn.
                function arcTween( a ) {
                    var i = d3.interpolate( this._current, a );
                    this._current = i( 0 );
                    return function ( t ) {
                        return arc( i( t ) );
                    };
                }

                return this.pC;
            },

            createLegend: function ( lD ) {
                var self = this;

                var leg = {};

                // create table for legend.
                var legend = d3.select( this.options.dashboardEl ).append( 'table' ).attr( 'class', 'LC-legend' );

                // create one row per segment.
                var tr = legend.append( 'tbody' ).selectAll( 'tr' ).data( lD ).enter().append( 'tr' );

                // create the first column for each segment.
                tr.append( 'td' ).append( 'svg' ).attr( 'width', '16' ).attr( 'height', '16' ).append( 'rect' )
                    .attr( 'width', '16' ).attr( 'height', '16' )
                    .attr( 'fill', function ( d ) {
                        return self.calculateColor( d.type );
                    } );

                // create the second column for each segment.
                tr.append( 'td' ).text( function ( d ) {
                    return d.type;
                } );

                // create the third column for each segment.
                tr.append( 'td' ).attr( 'class', 'LC-legend__data js-LC-legend_frequency' )
                    .text( function ( d ) {
                        return d3.format( ',' )( d.freq );
                    } );

                // create the fourth column for each segment.
                tr.append( 'td' ).attr( 'class', 'LC-legend__data js-LC-legend_percentage' )
                    .text( function ( d ) {
                        return getLegend( d, lD );
                    } );

                // utility function to be used to update the legend.
                leg.update = function ( nD ) {
                    // update the data attached to the row elements.
                    var l = legend.select( 'tbody' ).selectAll( 'tr' ).data( nD );

                    // update the frequencies.
                    l.select( '.js-LC-legend_frequency' ).text( function ( d ) {
                        return d3.format( ',' )( d.freq );
                    } );

                    // update the percentage column.
                    l.select( '.js-LC-legend_percentage' ).text( function ( d ) {
                        return getLegend( d, nD );
                    } );
                };

                // utility function to compute percentage.
                function getLegend( d, aD ) {
                    return d3.format( '%' )( d.freq / d3.sum( aD.map( function ( v ) {
                            return v.freq;
                        } ) ) );
                }

                return leg;

            }

        } );

        window.modules = window.modules || {};
        window.modules.LayoutChart = new LayoutChart();

    } );

} )( window, jQuery, d3 );