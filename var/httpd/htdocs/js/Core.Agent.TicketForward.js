// --
// Copyright (C) 2001-2021 OTRS AG, https://otrs.com/
// Copyright (C) 2021 Znuny GmbH, https://znuny.org/
// --
// This software comes with ABSOLUTELY NO WARRANTY. For details, see
// the enclosed file COPYING for license information (GPL). If you
// did not receive this file, see https://www.gnu.org/licenses/gpl-3.0.txt.
// --

"use strict";

var Core = Core || {},
    Znuny = Znuny || {};
Core.Agent = Core.Agent || {};

/**
 * @namespace Core.Agent.TicketForward
 * @memberof Core.Agent
 * @author OTRS AG
 * @description
 *      This namespace contains the TicketForward functions.
 */
Core.Agent.TicketForward = (function (TargetNS) {

    /**
     * @name Init
     * @memberof Core.Agent.TicketForward
     * @function
     * @description
     *      This function initializes the functionality for the TicketForward screen.
     */
    TargetNS.Init = function () {

        var ArticleComposeOptions = Core.Config.Get('ArticleComposeOptions'),
            UpdateFields = Core.Config.Get('DynamicFieldNames') || [];

        Znuny.Form.Input.FieldIDMapping('AgentTicketForward',
            {
                Body:           'RichText',
                StateID:        'ComposeStateID',
                Customer:       'ToCustomer',
                CustomerUserID: 'ToCustomer',
                ServiceID:      'ServiceID',
                SLAID:          'SLAID',
                TypeID:         'TypeID',
                PriorityID:     'NewPriorityID'
            }
        );

        UpdateFields.push('TypeID');
        UpdateFields.push('ServiceID');
        UpdateFields.push('SLAID');

        $('#TypeID').on('change', function () {
            Core.AJAX.FormUpdate($(this).parents('form'), 'AJAXUpdate', 'TypeID', UpdateFields);
        });

        $('#ServiceID').on('change', function () {
            Core.AJAX.FormUpdate($(this).parents('form'), 'AJAXUpdate', 'ServiceID', UpdateFields);
        });

        $('#SLAID').on('change', function () {
            Core.AJAX.FormUpdate($(this).parents('form'), 'AJAXUpdate', 'SLAID', UpdateFields);
        });


        // remove a customer ticket entry
        $('.CustomerTicketRemove').on('click', function () {
            Core.Agent.CustomerSearch.RemoveCustomerTicket($(this));
            return false;
        });

        // update dynamic fields in form
        $('#ComposeStateID').on('change', function () {
            Core.AJAX.FormUpdate($(this).parents('form'), 'AJAXUpdate', 'ComposeStateID', UpdateFields);
        });

        // change article compose options
        if (typeof ArticleComposeOptions !== 'undefined') {
            $.each(ArticleComposeOptions, function (Key, Value) {
                $('#'+Value.Name).on('change', function () {
                    Core.AJAX.FormUpdate($(this).parents('form'), 'AJAXUpdate', Value.Name, Value.Fields);
                });
            });
        }
    };

    Core.Init.RegisterNamespace(TargetNS, 'APP_MODULE');

    return TargetNS;
}(Core.Agent.TicketForward || {}));
