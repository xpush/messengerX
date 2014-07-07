angular.module('starter.constants', [])

  .constant('APP_INFO', {
    version: '1.0 BETA',
    feedVersion: 'V1',
    appKey : 'messengerx'
  })
  .constant('BASE_URL', 'stalk-front-s01.cloudapp.net')
  //.constant('BASE_URL', 'localhost')

  .constant('DB_CONFIG', {
    name: 'stalk.db',
    version: '1.1', 
    tables: [
      {
        name: 'TB_MESSAGE',
        columns: [
          {name: 'channel_id',   type: 'text'},
          {name: 'sender_id',  type: 'text'},
          {name: 'sender_name',  type: 'text'},
          {name: 'sender_image',  type: 'text'},
          {name: 'message',    type: 'text'},
          {name: 'type', type: 'text'},
          {name: 'time', type: 'integer'},
          {name: 'owner_id', type: 'text'}
        ],
        table_index : { name : 'IDX_TB_MESSAGE', columns : [ 'channel_id', 'owner_id' ] }
      },
      {
        name: 'TB_CHANNEL',
        columns: [
          //{name: '_id',     type: 'integer primary key autoincrement'},
          {name: 'channel_id',   type: 'text'},
          {name: 'channel_name',  type: 'text'},
          {name: 'channel_users',    type: 'text'},
          {name: 'channel_image', type: 'text'},
          {name: 'unread_count', type: 'integer'},
          {name: 'latest_message', type: 'text'},
          {name: 'channel_updated', type: 'integer'},
          {name: 'owner_id', type: 'text'}
        ]
      }
    ]
});