// --
// Copyright (C) 2021 Znuny GmbH, https://znuny.org/
// --
// This software comes with ABSOLUTELY NO WARRANTY. For details, see
// the enclosed file COPYING for license information (AGPL). If you
// did not receive this file, see http://www.gnu.org/licenses/agpl.txt.
// --

/**
 * Alert Module
 *
 * Handles alert display and management.
 * Provides functionality for displaying alerts with messages and action links.
 * Supports both legacy DOM-based alerts and JSON-based alerts with multiple actions.
 */

/* global Env */
(function (jQuery) {
    Env.Application.Alert = function (ctx, sandbox, moduleId) {
        Env.Module.call(this, ctx, sandbox, moduleId);
    };
    Env.Application.Alert.prototype = new Env.Module();
    Env.Application.Alert.prototype.constructor = Env.Application.Alert;
    jQuery.extend(Env.Application.Alert.prototype, {

        // Module configuration
        name: 'modAlert',

        // Alert data
        alertData: null,

        /**
         * Hook function to load the module specific dependencies.
         *
         * @method dependencies
         */
        dependencies: function () {
            // No dependencies to load
        },

        /**
         * Hook function to do module specific stuff before binding the events.
         *
         * @method onInit
         */
        onInit: function () {
            // First try to get alert data from JSON
            this.processAlertData();
        },

        /**
         * Hook function to initialize the module and bind events.
         *
         * @method onStart
         */
        onStart: function () {
            var html, messagesModule;

            this.bindEvents();

            if (this.alertData) {
                html = this.createAlert(this.alertData);

                // Find the Messages module and send the generated HTML to it
                messagesModule = this.findMessagesModule();
                if (messagesModule) {
                    messagesModule.addMessage(html, this.alertData.type || 'notice', this.alertData.hideAfter || 0);
                }
            }
        },

        /**
         * Process alert data from JSON
         *
         * @method processAlertData
         */
        processAlertData: function() {
            var $alertDataScript, alertData;

            $alertDataScript = jQuery('.alertData', this.ctx);

            if (!$alertDataScript.length) {
                return;
            }

            try {
                alertData = JSON.parse($alertDataScript.text());

                // Store the alert data for future use
                this.alertData = alertData;

                // Add type property if not present
                if (!this.alertData.type) {
                    this.alertData.type = "notice";
                }

                // Ensure actions is always an array
                if (!this.alertData.actions) {
                    this.alertData.actions = [];
                }

            } catch (e) {
                console.error('Error parsing alert data JSON:', e); // eslint-disable-line no-console
            }
        },

        /**
         * Bind event handlers
         *
         * @method bindEvents
         */
        bindEvents: function() {
            // Bind click event to all action links
            jQuery('a', this.ctx).on('click', function(event) {
                // If the link has the UndoClosePopup class, close the popup
                if (jQuery(event.currentTarget).hasClass('UndoClosePopup')) {
                    // If we're in a popup, close it
                    if (Core && Core.UI && Core.UI.Popup) {
                        Core.UI.Popup.ClosePopup();
                    }
                    // TODO: Wait for QA. If QA is error-free, this can be deleted.
                    // else if (window.opener) {
                    //     window.close();
                    // }
                }
            });
        },

        /**
         * Find the Messages module instance
         *
         * @method findMessagesModule
         * @return {Object|null} The Messages module instance or null if not found
         */
        findMessagesModule: function() {
            var $messagesModule, moduleId;

            // Look for the Messages module in the DOM
            $messagesModule = jQuery('.mod.modMessages');

            if ($messagesModule.length) {
                // Get the module ID
                moduleId = $messagesModule.attr('data-moduleid');

                // Get the module instance from the sandbox
                if (moduleId) {
                    return this.sandbox.getModule(moduleId);
                }
            }
        },


        capitalizeFirstLetter: function (string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        },

        /**
         * Create a single alert from JSON data
         *
         * @method createAlert
         * @param {Object} data - The alert data
         * @return {String} HTML for the alert
         */
        createAlert: function(data) {
            var type, html, self, inlineMultipleActions, separatorText, actionClasses, actionId;

            if (!data) {
                return '';
            }

            // Add default type if not present
            type = data.type || 'notice';
            self = this;

            html = '<div class="mod modAlert">';
            html += '<div class="inner">';
            html += '<div class="alert alertType' + this.capitalizeFirstLetter(type) + '">';
            html += '<div class="alertContent">' + data.message + '</div>';

            // Handle multiple actions
            if (data.actions && data.actions.length) {
                inlineMultipleActions = data.actions.length > 1;
                separatorText = data.actionSeparator || 'or';

                html += '<div class="alertActions' + (inlineMultipleActions ? ' alertActionsInline' : '') + '">';
                data.actions.forEach(function (action, index) {
                    if (action.url) {
                        actionClasses = 'btn-primary alertButton alertButton' + self.capitalizeFirstLetter(action.type || 'submit'),
                            actionId = '';

                        if (action.classes) {
                            actionClasses += ' ' + (Array.isArray(action.classes) ? action.classes.join(' ') : action.classes);
                        }

                        if (action.id) {
                            actionId = ' id="' + action.id + '"';
                        }

                        html += '<a class="' + actionClasses + '" href="' + action.url + '"' + actionId + '>';
                        html += action.text || 'Action';
                        html += '</a>';

                        // Insert separator between inline actions
                        if (inlineMultipleActions && index < data.actions.length - 1) {
                            html += '<span class="alertActionSeparator">' + separatorText + '</span>';
                        }
                    }
                });
                html += '</div>';
            }
            html += '</div>';
            html += '</div>';
            html += '</div>';

            return html;
        }
    });
})(jQuery);
