angular.module('starter.constants', [])

  .constant('APP_INFO', {
    version: '1.0 BETA',
    feedVersion: 'V1',
    appKey : 'messengerx'
  })
  .constant('BASE_URL', 'http://stalk-front-s01.cloudapp.net:8000')
  .constant('DB_CONFIG', {
    name: 'stalk.db',
    version: '0.56',
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
          {name: 'bookmark_flag', type: 'text DEFAULT "N" '},
          {name: 'owner_id', type: 'text'}
        ],
        table_index : [{ type : '', name : 'IDX_TB_MESSAGE', columns : [ 'channel_id', 'owner_id' ] }]
      },
      {
        name: 'TB_SCAN',
        virtual: true,
        columns: [
          {name: 'channel_id',   type: 'text'},
          {name: 'sender_id',  type: 'text'},
          {name: 'sender_name',  type: 'text'},
          {name: 'sender_image',  type: 'text'},
          {name: 'message',    type: 'text'},
          {name: 'type', type: 'text'},
          {name: 'time', type: 'integer'},
          {name: 'bookmark_flag', type: 'text DEFAULT "N" '},
          {name: 'owner_id', type: 'text'}
        ]
      },
      {
        name: 'TB_CHANNEL',
        columns: [
          {name: 'channel_id',   type: 'text'},
          {name: 'channel_name',  type: 'text'},
          {name: 'channel_users',    type: 'text'},
          {name: 'channel_image', type: 'text DEFAULT "" '},
          {name: 'unread_count', type: 'integer'},
          {name: 'latest_message', type: 'text'},
          {name: 'channel_updated', type: 'integer'},
          {name: 'owner_id', type: 'text'}
        ],
        table_index : [{ type : 'UNIQUE', name : 'IDX_U_TB_CHANNEL', columns : [ 'channel_id', 'owner_id' ] }, { type : '', name : 'IDX_TB_CHANNEL', columns : [ 'owner_id' ] }]
      },
      {
        name: 'TB_NOTICE',
        columns: [
          {name: 'channel_id',   type: 'text'},
          {name: 'message', type: 'text DEFAULT "" '},
          {name: 'location', type: 'text DEFAULT "" '},
          {name: 'sender_id', type: 'text'},
          {name: 'use_flag', type: 'text'},
          {name: 'fold_flag', type: 'text'},
          {name: 'vote_flag', type: 'text'},
          {name: 'updated', type: 'intege r'},
          {name: 'owner_id', type: 'text'}
        ],
        table_index : [{ type : 'UNIQUE', name : 'IDX_U_TB_NOTICE', columns : [ 'channel_id', 'owner_id' ] }]
      },
      {
        name: 'TB_USER',
        columns: [
          {name: 'user_id',   type: 'text'},
          {name: 'user_name',  type: 'text'},
          {name: 'message',    type: 'text'},
          {name: 'image', type: 'text'},
          {name: 'chosung', type: 'text'},
          {name: 'owner_id', type: 'text'}
        ],
        table_index : [
          { type : 'UNIQUE', name : 'IDX_U_TB_USER', columns : [ 'user_id', 'owner_id' ] },
          { type : '', name : 'IDX_TB_USER', columns : [ 'owner_id' ] }
        ]
      },
      {
        name: 'TB_REFRESH_HISTORY',
        columns: [
          {name: 'time',   type: 'integer'},
          {name: 'owner_id',   type: 'text'}
        ],
        table_index : [
          { type : 'UNIQUE', name : 'IDX_TB_USER_VERSION', columns : [ 'owner_id' ] }
        ]
      },
      {
        name: 'TB_EMOTICON',
        columns: [
          {name: 'group_id',   type: 'text'},
          {name: 'tag',  type: 'text'},
          {name: 'image',    type: 'text'},
          {name: 'owner_id', type: 'text'}
        ],
        table_index : [{ type : '', name : 'IDX_TB_EMOTICON', columns : [ 'owner_id' ] }]
      }
    ]
});
