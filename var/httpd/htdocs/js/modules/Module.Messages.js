// --
// Copyright (C) 2021 Znuny GmbH, https://znuny.org/
// --
// This software comes with ABSOLUTELY NO WARRANTY. For details, see
// the enclosed file COPYING for license information (AGPL). If you
// did not receive this file, see http://www.gnu.org/licenses/agpl.txt.
// --

/**
 * Messages Module
 *
 * Handles alert display and management.
 * Provides functionality for displaying alerts with messages and action links.
 * Supports both legacy DOM-based alerts and JSON-based alerts with multiple actions.
 */

/* global Env */
(function (jQuery) {
    Env.Application.Messages = function (ctx, sandbox, moduleId) {
        Env.Module.call(this, ctx, sandbox, moduleId);
    };
    Env.Application.Messages.prototype = new Env.Module();
    Env.Application.Messages.prototype.constructor = Env.Application.Messages;
    jQuery.extend(Env.Application.Messages.prototype, {

        // Module configuration
        name: 'modMessages',

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
            // Load closed messages from session
            this.getClosedMessages();

            // First try to get alert data from JSON
            this.processMessagesData();

            // If no JSON data found, extract from DOM (legacy mode)
            if (!this.alertData) {
                this.extractMessagesData();
            }
        },

        /**
         * Hook function to initialize the module and bind events.
         *
         * @method onStart
         */
        onStart: function () {
            this.bindEvents();
        },

        addMessage: function (html, type, hideAfter, messageId) {
            var that, $messages, closeIconPath, closeTranslation, closeHtml, $message, modules, i, messageText, $tempDiv;

            that = this;
            $messages = jQuery('.messages', this.ctx);
            closeIconPath = jQuery('.inner', this.ctx).attr('data-close-icon-path');
            closeTranslation = jQuery('.inner', this.ctx).attr('data-close-translation');
            closeHtml = '<span class="messageClose"><img src="'+ closeIconPath +'" alt="'+ closeTranslation+'"/></span>';

            // Generate messageId if not provided
            if (!messageId) {
                // Extract message text from HTML
                $tempDiv = jQuery('<div>').html(html);
                messageText = $tempDiv.find('p').first().text().trim() || $tempDiv.text().trim();
                messageId = this.generateMessageId(messageText);
            }

            $message = jQuery('<div class="message message' + this.capitalizeFirstLetter(type) + '" data-hide-after="' + hideAfter + '" data-message-id="' + messageId + '">' + html + closeHtml + '</div>');
            $messages.append($message);
            hideAfter = hideAfter || 0;

            modules = that.sandbox.application.registerModules($messages);
            for (i = 0; i < modules.length; i++) {
                that.sandbox.application.start(modules[i]);
            }
            this.bindEvents();

            // add active class after short time
            setTimeout(function() {
                jQuery('.message', that.ctx).addClass('messageActive');
            }, "200");

            // If hideAfter is specified and greater than 0, set up a timer to hide the message
            if (hideAfter > 0) {
                setTimeout(function () {
                    $message.fadeOut('slow', function () {
                        $message.remove();
                    });
                }, hideAfter * 1000); // Convert seconds to milliseconds
            }
        },


        capitalizeFirstLetter: function (string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        },

        /**
         * Bind event handlers
         *
         * @method bindEvents
         */
        bindEvents: function () {
            var that = this;

            jQuery('.messageClose', this.ctx).on('click', function () {
                var $message = jQuery(this).closest('.message'),
                    messageId = $message.attr('data-message-id');

                if (messageId) {
                    // Save closed message ID to session
                    that.addClosedMessage(messageId);
                }

                $message.remove();
            });
        },

        /**
         * Process messages data from JSON
         *
         * @method processMessagesData
         * @return {Boolean} Success status
         */
        processMessagesData: function () {
            var $alertDataScript, alertData, messageHtml, i, action, messageId;

            // Look for alert data in JSON format
            $alertDataScript = jQuery('.alertData', this.ctx);

            if ($alertDataScript.length) {
                try {
                    // Parse the JSON data
                    alertData = JSON.parse($alertDataScript.text());
                    this.alertData = alertData;

                    // Get message ID from alertData or generate from message text
                    messageId = alertData.id || this.generateMessageId(alertData.message);

                    // Check if message was already closed
                    if (this.isMessageClosed(messageId)) {
                        // Message was closed, don't display it
                        return false;
                    }

                    // Create message HTML
                    messageHtml = '<p>' + alertData.message + '</p>';

                    // Add action buttons if present
                    if (alertData.actions && alertData.actions.length) {
                        messageHtml += '<div class="message-actions">';

                        // Add each action button
                        for (i = 0; i < alertData.actions.length; i++) {
                            action = alertData.actions[i];
                            if (action && action.url){
                                messageHtml += '<a href="' + action.url + '" class="' + (action.classes || '') + '">' + action.text + '</a>';
                            }else{
                                messageHtml += action.text;
                            }
                        }

                        messageHtml += '</div>';
                    }

                    // Add close button
                    messageHtml += '<a class="close" href="#"><i class="fa fa-times"></i></a>';

                    // Add the message with message ID
                    this.addMessage(messageHtml, alertData.type || 'notice', alertData.hideAfter || 0, messageId);

                    return true;
                } catch (e) {
                    // Error parsing alert data JSON - silently fail
                }
            }

            return false;
        },

        /**
         * Extract messages data from DOM (legacy mode)
         *
         * @method extractMessagesData
         * @return {Boolean} Success status
         * @description
         *      This method is only called if no JSON alert data was found.
         *      It looks for legacy message elements that are already in the DOM.
         *      If no legacy messages exist, $messages will be empty, which is normal.
         */
        extractMessagesData: function () {
            var that = this,
                $messages;

            // Look for legacy message elements that are already in the DOM
            // Note: This will be empty if messages are created via JSON (processMessagesData)
            // or if there are no legacy messages in the DOM
            $messages = jQuery('.message', this.ctx);

            if ($messages.length) {
                $messages.each(function (index, element) {
                    var $message, hideAfter, messageText, messageId;

                    $message = jQuery(element);

                    // Get message text and generate ID if not present
                    messageText = $message.text().trim();
                    messageId = $message.attr('data-message-id') || that.generateMessageId(messageText);

                    // Check if message was already closed
                    if (that.isMessageClosed(messageId)) {
                        // Message was closed, remove it
                        $message.remove();
                        return;
                    }

                    // Get hideAfter value if present
                    hideAfter = parseInt($message.attr('data-hide-after') || '0', 10);

                    // If hideAfter is specified and greater than 0, set up a timer to hide the message
                    if (hideAfter > 0) {
                        setTimeout(function () {
                            $message.fadeOut('slow', function () {
                                $message.remove();
                            });
                        }, hideAfter * 1000); // Convert seconds to milliseconds
                    }
                });

                return true;
            }

            return false;
        },

        /**
         * Generate a unique message ID from message text
         *
         * @method generateMessageId
         * @param {String} messageText - The message text
         * @return {String} Message ID
         */
        generateMessageId: function (messageText) {
            var hash = 0,
                i,
                chr,
                normalizedText;

            if (!messageText || messageText.length === 0) {
                // Use a fixed ID for empty messages so they can be recognized consistently
                return 'msg_empty';
            }

            // Normalize message text: trim and remove HTML tags for consistent hashing
            // This ensures the same message text always generates the same ID
            normalizedText = messageText.replace(/<[^>]*>/g, '').trim();

            if (normalizedText.length === 0) {
                // Use a fixed ID for empty messages (after normalization) so they can be recognized consistently
                return 'msg_empty';
            }

            // Generate hash from normalized message text using djb2-like algorithm
            // This converts the string into a numeric hash value:
            // - charCodeAt() gets the Unicode value of each character
            // - (hash << 5) - hash is equivalent to hash * 31, which is a common multiplier
            // - Adding the character code accumulates the hash
            // - hash & hash ensures the result stays within 32-bit integer range
            for (i = 0; i < normalizedText.length; i++) {
                chr = normalizedText.charCodeAt(i);
                hash = ((hash << 5) - hash) + chr;
                hash = hash & hash; // Convert to 32bit integer
            }

            return 'msg_' + Math.abs(hash).toString(36);
        },

        /**
         * Get closed messages from session
         *
         * @method getClosedMessages
         */
        getClosedMessages: function () {
            var closedMessagesJson = Core.Config.Get('UserClosedMessages') || '[]';

            // If it's already an array, use it directly
            if (jQuery.isArray(closedMessagesJson)) {
                this.closedMessages = closedMessagesJson;
            } else {
                try {
                    this.closedMessages = JSON.parse(closedMessagesJson);
                } catch (e) {
                    this.closedMessages = [];
                }
            }

            if (!jQuery.isArray(this.closedMessages)) {
                this.closedMessages = [];
            }
        },

        /**
         * Check if a message is closed
         *
         * @method isMessageClosed
         * @param {String} messageId - The message ID
         * @return {Boolean} True if message is closed
         */
        isMessageClosed: function (messageId) {
            var isClosed = false,
                i;

            if (!this.closedMessages) {
                this.getClosedMessages();
            }

            if (!messageId) {
                return false;
            }

            // Trim messageId to avoid whitespace issues
            messageId = String(messageId).trim();

            // Check if messageId is in closedMessages array
            isClosed = false;
            for (i = 0; i < this.closedMessages.length; i++) {
                if (String(this.closedMessages[i]).trim() === messageId) {
                    isClosed = true;
                    break;
                }
            }

            return isClosed;
        },

        /**
         * Add closed message ID to closedMessages array
         *
         * @method addClosedMessage
         * @param {String} messageId - The message ID to add
         */
        addClosedMessage: function (messageId) {

            var closedMessagesJson;

            if (!this.closedMessages) {
                this.getClosedMessages();
            }

            // Add message ID if not already in array
            if (jQuery.inArray(messageId, this.closedMessages) === -1) {
                this.closedMessages.push(messageId);

                // Update session via AJAX
                if (typeof Core !== 'undefined' && Core.Agent && Core.Agent.UpdateSessionID) {
                    closedMessagesJson = JSON.stringify(this.closedMessages);
                    Core.Agent.UpdateSessionID('UserClosedMessages', closedMessagesJson,
                        function() {
                            // Success callback - message added to closedMessages array
                        },
                        function() {
                            // Error callback - silently fail
                        }
                    );
                }
            }
        },

    });
})(jQuery);
