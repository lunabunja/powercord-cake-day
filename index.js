/*
 * Copyright (c) 2020 Cynthia K. Rey, Umut İ. Erdoğan and other contributors
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

const { Plugin } = require('powercord/entities');
const { findInReactTree } = require('powercord/util');
const { inject, uninject } = require('powercord/injector');
const { getModule, getModuleByDisplayName, React } = require('powercord/webpack');

const Settings = require('./settings');
const Cake = require('./cake');

module.exports = class CakeDay extends Plugin {
  async startPlugin() {
    this.loadStylesheet('style.scss');
    powercord.api.settings.registerSettings(this.entityID, { category: this.entityID, label: 'Cake Day', render: Settings });

    if (this.settings.get('dms', true))
      this.injectDM()
    if (this.settings.get('messages', true))
      this.injectChat()
    if (this.settings.get('membersList', true))
      this.injectMemberList()
  }

  async pluginWillUnload() {
    powercord.api.settings.unregisterSettings(this.entityID);
    uninject('cake-day-dms');
    uninject('cake-day-chat');
    uninject('cake-day-members');
  }

  async injectDM() {
    // DM Injection
    const users = await getModule(['getUsers']);
    const PrivateChannel = await getModuleByDisplayName('PrivateChannel');

    inject('cake-day-dms', PrivateChannel.prototype, 'render', (_, res) => {
      if (!this.settings.get('debug', false) && (!res.type.render || (users.getUser(res.props?.user?.id)?.createdAt.getMonth() !== new Date().getMonth() || users.getUser(res.props?.user?.id)?.createdAt.getDate() !== new Date().getDate()))) {
        return res;
      }

      this.log("Someone has a Cake Day! 🎉");

      // TODO: Idk if this will work with badges everywhere.
      res.props.name = React.createElement('div', { className: 'cake-day-dm-wrapper' }, [
        React.createElement('div', null, res.props.name),
        React.createElement(Cake)
      ]);

      return res;
    });
  }

  async injectChat() {
    // Chat Injection
    const users = await getModule(['getUsers']);
    const MessageHeader = await getModule(['MessageTimestamp']);

    inject('cake-day-chat', MessageHeader, 'default', ([ { message: { author: { id: userId }, } } ], res) => {
      if (!this.settings.get('debug', false) && (!users.getUser(userId) || (users.getUser(userId).createdAt.getMonth() !== new Date().getMonth() || users.getUser(userId).createdAt.getDate() !== new Date().getDate()))) {
        return res;
      }

      const header = findInReactTree(res, e => Array.isArray(e?.props?.children) && e.props.children.find(c => c?.props?.message));
      this.log("Someone has a Cake Day! 🎉");
      header.props.children.push(React.createElement(Cake));

      return res;
    });
  }

  async injectMemberList() {
    // Members List Injection
    const users = await getModule(['getUsers']);
    const MemberListItem = await getModuleByDisplayName('MemberListItem');

    inject('cake-day-members', MemberListItem.prototype, 'render', (_, res) => {
      if (!this.settings.get('debug', false) && (!res.type.render || (users.getUser(res.props?.user?.id)?.createdAt.getMonth() !== new Date().getMonth() || users.getUser(res.props?.user?.id)?.createdAt.getDate() !== new Date().getDate()))) {
        return res;
      }

      this.log("Someone has a Cake Day! 🎉");
      res.props.decorators?.props.children.push(React.createElement(Cake));

      return res;
    });
  }
}