if (!window.MES) {

    window.MES = {

        /**
         * 'E' for English, 'F' for French or 'S' for Spanish
         */
        lang : 'E',

        /*
         This setting is used to integrate FAOSTAT M&S with the Gateway.
         It can't be stored in the JSON configuration file because it is
         used to locate the JSON configuration file.
         */
        prefix : 'http://168.202.23.17:8080/faostat-mes-js/',

        /**
         * e.g. FAOSTATPROD
         */
        datasource : '',

        /**
         * e.g. localhost:8080
         */
        baseurl : '',

        /**
         * Custom FAOSTAT theme
         */
        theme : '',

        /**
         * Used in the 'Classification' tab
         */
        selectedDomainCode : null,
        selectedDomainLabel : null,

        /**
         * Used in the 'Classification' tab
         */
        selectedDomainName : null,

        /**
         * @param lang Language for the UI, it can be 'E' (default),
         * 'F' or 'S'
         *
         * Read settings and initiate the module.
         *
         */
        init : function(groupCode, domainCode, lang) {

            /**
             * Language: as parameter or from the URL
             */
            if (lang != null && lang.length > 0) {
                MES.lang = lang;
            }
            var tmp = $.url().param('lang');
            if (tmp != null && tmp.length > 0)
                MES.lang = tmp;

            /**
             * Read and store settings for web-services
             */
            $.getJSON(MES.prefix + 'config/faostat-mes-configuration.json', function(data) {
                MES.datasource = data.datasource;
                MES.baseurl = data.baseurl;
            });

            /**
             * Initiate multi-language
             */
            var I18NLang = '';
            switch (MES.lang) {
                case 'F' : I18NLang = 'fr'; break;
                case 'S' : I18NLang = 'es'; break;
                default: I18NLang = 'en'; break;
            }
            $.i18n.properties({
                name: 'I18N',
                path: MES.prefix + 'I18N/',
                mode: 'both',
                language: I18NLang
            });

            /**
             * Load the structure in the 'container' DIV
             */
            $('#container').load(MES.prefix + 'structure.html', function() {
//				MES.show('methodology_list');
                if ( groupCode == 'classifications')
                    MES.load_classifications();
                else
                    MES.show(groupCode);
                document.getElementById(groupCode).checked = true;
            });

        },

        /**
         * @param mesType It can be: 'methodology', classifications', 'units', local_currency', 'glossary' or 'abbreviations'
         *
         * Show UI according to the type
         */
        loadUI : function(mesType) {
            switch(mesType) {
                case 'classifications': MES.load_classifications(); break;
                default: MES.show(mesType); break;
            }
        },

        show : function(code) {

            MS_STATS.show(code);

            if ( code != 'methodology' )
                CORE.upgradeURL('mes', code, "*", MES.lang)

            /** Size for the left td */
            switch(code) {
                case 'classifications':
                    $('#selection_panel').show();
                    $('#center_panel').css('width', '690px');
                    break;
                case 'methodology_list':
                    $('#selection_panel').show();
                    $('#center_panel').css('width', '690px');
                    break;
                case 'abbreviations':
                    $('#selection_panel').hide();
                    $('#center_panel').css('width', '928px');
                    break;
                case 'glossary':
                    $('#center_panel').css('width', '928px');
                    $('#selection_panel').hide();
                    break;
                case 'units':
                    $('#center_panel').css('width', '928px');
                    $('#selection_panel').hide();
                    break;
            }

            if (code == 'methodology_list') {
                $.ajax({
                    type: 'GET',
                    url: 'http://' + MES.baseurl + '/wds/rest/mes/' + code + '/json/' + MES.datasource + '/' + MES.selectedDomainCode + '/' + MES.lang,
                    success : function(response) {
                        MES.load_methodologies(response);
                    },
                    error : function(err,b,c) {
                        alert(err.status + ", " + b + ", " + c);
                    }
                });

            } else {

                $.ajax({

                    type: 'GET',
                    url: 'http://' + MES.baseurl + '/wds/rest/mes/' + code + '/html/' + MES.datasource + '/' + MES.selectedDomainCode + '/' + MES.lang,

                    success : function(response) {

                        var html = document.createElement('div');
                        html.innerHTML = response;
                        /**
                         * Clear
                         */
                        if (code != 'classifications' && code != 'methodology') {
                            document.getElementById('content_panel_export').innerHTML = '';
                            document.getElementById('content_panel_table').innerHTML = '';
                        }
                        /*
                         * Table width
                         **/
                        var width = null;
                        switch(code) {
                            case 'classifications':
                                MES.selectedDomainName = $.i18n.prop('_classifications');
                                break;
                            case 'methodology':
                                MES.selectedDomainName = $.i18n.prop('_methodology_list');
                                break;
                            case 'abbreviations':
//								width = '928px';
                                MES.selectedDomainName = $.i18n.prop('_abbreviations_list');
                                break;
                            case 'glossary':
//								width = '928px';
                                MES.selectedDomainName = $.i18n.prop('_glossary_list');
                                break;
                            case 'units':
//								width = '928px';
                                MES.selectedDomainName = $.i18n.prop('_standard_units_and_symbols');
                                break;

                        }

                        /**
                         * Show and format the result
                         */
                        if (code == 'methodology') {

                            // Headers
                            var headers = [];
                            headers.push($.i18n.prop('_note'));
                            headers.push($.i18n.prop('_coverage'));
                            headers.push($.i18n.prop('_reference'));
                            headers.push($.i18n.prop('_collection'));
                            headers.push($.i18n.prop('_estimation'));

                            // get the table
                            var s = '';
                            var html = document.createElement('div');
                            var counter = 0;
                            html.innerHTML = response;
                            s += '<div class="obj-box">';
                            $('td', html).each(function(k, v) {
                                s += '<div class="mes-subtitle">' + headers[counter++] + '</div>';
                                s += '<div class="mes-text-box">' + v.innerHTML + '</div>';
                            });
                            s += '</div>';

                            // format the content
                            var t = '<div class="standard-title">' + MES.selectedDomainLabel +'</div>';
//                            t += '<hr class="standard-hr">';
                            document.getElementById('content_panel_table').innerHTML = t;
                            $('#content_panel_table').append(s);

                        } else {

                            //  alert('here')

                            // add content
                            document.getElementById('content_panel_table').innerHTML = response;

                            var s = '<div class="standard-title" style="float:left">' + MES.selectedDomainName.replace('<br>', ' ') + '</div>';
                            /**s += '<img style="background-color:#000; margin-top:15px; cursor:pointer; float:right;" onclick="MES.export_excel(\'' + code + '\');" ' +
                             'src="http://hqlprfenixapp1.hq.un.fao.org:42000/faostat-mes-js/images/export.png">' +
                             '</div>';*/

                            s += '<div id="export_icon" style="margin-top:15px;" class="obj-box-icon export-icon"></div>';

                            s += '<div class="clear"></div>';
                            s += '<hr class="standard-hr">';

                            document.getElementById('content_panel_export').innerHTML = s;

                            // tooltip
                            document.getElementById('export_icon').title = $.i18n.prop('_export');
                            $('#export_icon').powerTip({placement: 'n'});

                            $('#export_icon').click( function() {
                                MES.export_excel(code);
                            });

                        }
                    },

                    error : function(err,b,c) {
                        alert("This feature is not yet available.");
                    }

                });

            }

        },

        export_excel : function(code) {
            var actionURL = 'http://' + MES.baseurl + '/wds/rest/mes/' + code + '/excel/' + MES.datasource + '/' + MES.selectedDomainCode + '/' + MES.lang;
            document.exportMES.action = actionURL;
            document.exportMES.submit();
            MS_STATS.download(code);
        },

        load_methodologies : function(response) {

            /**
             * Clear previous sections, if any
             */
            document.getElementById('content_panel_export').innerHTML = '';
            document.getElementById('content_panel_table').innerHTML = '';
            document.getElementById('selection_panel').innerHTML = '';

            var payload = null;
            if (typeof response == 'string') {
                payload = $.parseJSON(response);
            } else {
                payload = response;
            }

            var data = new Array();

            /**
             * Something's wrong with the display of labels, so I had to fill the list
             * with labels only, I'll do the query based on that...
             */
            for (var i = 1 ; i < payload.length ; i++) {
                var row = {};
                row['code'] = payload[i][1];
                row['label'] = payload[i][1];
                data.push(row);
            }
            var source = {
                localdata: data,
                datatype: 'json',
                datafields: [{name: 'code'}, {nome: 'label'}],
                id: 'code'
            };
            var dataAdapter = new $.jqx.dataAdapter(source);

            var s = '<div class="standard-title">'+ $.i18n.prop("_methodology") + '</div>';
            s += '<hr class="standard-hr">';
            s +='<div class="methodology"><ul>';
            for (var i = 1 ; i < payload.length ; i++) {
                s += '<li id="met_' +payload[i][0] +'">' + CORE.breakLabelList(payload[i][1], 50) +' </li>';
            }
            s += '</ul></div>';
            document.getElementById('selection_panel').innerHTML = s;

            var title = '<div class="methodology_title">' + $.i18n.prop('_select_a_methodology_left') + '<div>';
            document.getElementById('content_panel_table').innerHTML = title;


            for (var i = 1 ; i < payload.length ; i++) {
                $("#met_" + payload[i][0]).click({code: payload[i][0], label: payload[i][1]}, function(event) {
                    MES.load_methodology(event.data.code, event.data.label);
                });
            }

        },

        load_methodology : function(code, label) {
            MES.selectedDomainCode = code;
            MES.selectedDomainLabel = label;
            MES.show('methodology');
        },

        load_classifications : function() {

            MS_STATS.show('classifications');

            CORE.upgradeURL('mes', 'classifications', "*", MES.lang)
            $('#selection_panel').show();
            $('#center_panel').css('width', '690px');

            /**
             * Clear previous sections, if any
             */
            document.getElementById('content_panel_export').innerHTML = '';
            document.getElementById('content_panel_table').innerHTML = '';

            var t = '<div class="standard-title">'+ $.i18n.prop('_fao_domains'); +'</div>';
            t += '<hr class="standard-hr">';
            document.getElementById('selection_panel').innerHTML = t;
            $('#selection_panel').append('<div id="mes-tree"></div>');

            var title = '<div class="methodology_title">' + $.i18n.prop('_select_a_domain_left') + '<div>';
            document.getElementById('content_panel_table').innerHTML = title;

            $.ajax({

                type: 'GET',
                url: 'http://' + MES.baseurl + '/wds/rest/groupsanddomains/' + MES.datasource + '/' + MES.lang,
                dataType: 'json',

                success : function(response) {

                    // Fetch JSON
                    var data = response;
                    if (typeof data == 'string')
                        data = $.parseJSON(response);

                    // Create root item
                    $('#mes-tree').append('<ul id="root"></ul>');

                    var groupIndices = MES.findGroupIndices(data);
                    for (var i = 0 ; i < groupIndices.length ; i++)
                        MES.buildGroup(data, groupIndices[i]);

                    // Initiate JQWidgets
                    $('#mes-tree').jqxTree({
                        theme : MES.theme
                    });


                    $('#mes-tree').bind('select', function (event) {
                        var args = event.args;
                        var item = $('#mes-tree').jqxTree('getItem', args.element);
                        $('#mes-tree').jqxTree('expandItem', item.element);
                        if (item.parentElement != null && item.hasItems == false) {
                            MES.selectedDomainCode = item.id;
                            MES.selectedDomainName = item.label;
                            MES.show('classifications');
                        }
                    });

                    $('#mes-tree').css('border-color', '#FFFFFF');

                },

                error : function(err,b,c) {
                    alert(err.status + ', ' + b + ', ' + c);
                }

            });

        },

        expand : function(event) {

            var args = event.args;
            var item = $('#mes-tree').jqxTree('getItem', args.element);
            var domainCode = item.value;
            var placeholderElement = $('#mes-tree').find("#placeholder_" + domainCode)[0];

            if (placeholderElement != null) {

                $.ajax({

                    type: 'GET',
                    url: 'http://' + MES.baseurl + '/wds/rest/domains/' + MES.datasource + '/' + domainCode + '/' + MES.language,
                    dataType: 'json',
                    success : function(response) {

                        var ord = new Array();

                        for (var i = 1 ; i < response.length ; i++) {

                            if ($.inArray(response[i][0], ord) < 0) {

                                /**
                                 * Blacklist the ORD
                                 */
                                ord.push(response[i][0]);

                                $('#mes-tree').jqxTree('removeItem', placeholderElement);
                                var label = CORE.breakLabelList(response[i][1], 50);
                                $('#mes-tree').jqxTree('addTo', { label: label, value: response[i][0] }, item.element);
                                $('#mes-tree').jqxTree('expandItem', item.element);

                            }

                        }

                        if (MES.selectedDomainCode != null) {
                            var found = false;
                            while (found == false) {
                                if (item != null) {
                                    var tmp = item.nextItem;
                                    if (tmp != null && tmp.value == MES.selectedDomainCode) {
                                        found = true;
                                        $('#mes-tree').jqxTree('selectItem', tmp.element);
                                    } else {
                                        item = tmp;
                                    }
                                } else {
                                    found = true;
                                }
                            }
                        }

                    },

                    error : function(err,b,c) {
                        alert(err.status + ", " + b + ", " + c);
                    }

                });

            }

        },

        breakLabel : function(label) {
            var blank_count = 0;
            var chars_limit = 25;
            var words_limit = 3;
            for (var z = 0 ; z < label.length ; z++) {
                if (label.charAt(z) == ' ') {
                    blank_count++;
                    if (blank_count >= words_limit || z >= chars_limit) {
                        return label.substring(0, z) + '<br>' + label.substring(1 + z);
                    }
                }
            }
            return label;
        },

        load_units : function() {
            alert('load_units');
        },

        load_local_currency : function() {
            alert('load_local_currency');
        },

        load_glossary : function() {
            alert('load_glossary');
        },

        load_abbreviations : function() {
            alert('load_abbreviations');
        }
        ,

        findGroupIndices : function(data) {
            var groups = [];
            var a = [];
            for (var i = 0 ; i < data.length ; i++) {
                if ($.inArray(data[i][0], groups) < 0) {
                    groups.push(data[i][0]);
                    a.push(i);
                }
            }
            return a;
        },

        buildGroup : function(data, startIDX) {
            var groupCode = data[startIDX][0];
            $('#root').append('<li id="' + groupCode + '">' + CORE.breakLabel(data[startIDX][1]));
            $('#' + groupCode).append('<ul id ="' + groupCode + '_root">');
            for (var i = startIDX ; i < data.length ; i++) {
                if (data[i][0] == groupCode)
                    $('#' + groupCode + '_root').append('<li id="' + data[i][2] + '">' + CORE.breakLabel(data[i][3]) + '</li>');
            }
            $('#' + groupCode).append('</ul>');
            $('#root').append('</li>');
        }

    };

}