angular.module('starter.constants', [])

  .constant('APP_INFO', {
    version: '1.0 BETA',
    feedVersion: 'V1'
  })

  .constant('BASE_URL', 'stalk-front-s01.cloudapp.net')

  .constant('DB_CONFIG', {
    name: 'stalk.db',
    tables: [
      {
        name: 'TB_MESSAGE',
        columns: [
          {name: '_id',     type: 'integer primary key autoincrement'},
          {name: 'channel',   type: 'text'},
          {name: 'sender',  type: 'text'},
          {name: 'message',    type: 'text'},
          {name: 'type', type: 'integer'},
          {name: 'time', type: 'integer'}
        ]
      },
      {
        name: 'TB_CHANNEL',
        columns: [
          //{name: '_id',     type: 'integer primary key autoincrement'},
          {name: 'channel',   type: 'text primary key'},
          {name: 'channel_name',  type: 'text'},
          {name: 'channel_user_id',    type: 'text'},
          {name: 'channel_image', type: 'text'},
          {name: 'unread_count', type: 'integer'},
          {name: 'latest_message', type: 'text'},
          {name: 'channel_updated', type: 'integer'}
        ]
      }
    ]
});