export var VERSION = '4.0';
export var PROTOCOL = 7;

// DEPRECATED: WS connection parameters
export var host = 'ws.pusherapp.com';
export var ws_port = 80;
export var wss_port = 443;
// DEPRECATED: SockJS fallback parameters
export var sockjs_host = 'sockjs.pusher.com';
export var sockjs_http_port = 80;
export var sockjs_https_port = 443;
export var sockjs_path = "/pusher";
// DEPRECATED: Stats
export var stats_host = 'stats.pusher.com';
// DEPRECATED: Other settings
export var channel_auth_endpoint = '/pusher/auth';
export var channel_auth_transport = 'ajax';
export var activity_timeout = 120000;
export var pong_timeout = 30000;
export var unavailable_timeout = 10000;

export var getDefaultStrategy = function(config : any) : any {
  var wsStrategy;
  if (config.encrypted) {
    wsStrategy = [
      ":best_connected_ever",
      ":ws_loop",
      [":delayed", 2000, [":http_loop"]]
    ];
  } else {
    wsStrategy = [
      ":best_connected_ever",
      ":ws_loop",
      [":delayed", 2000, [":wss_loop"]],
      [":delayed", 5000, [":http_loop"]]
    ];
  }

  return [
    [":def", "ws_options", {
      hostUnencrypted: config.wsHost + ":" + config.wsPort,
      hostEncrypted: config.wsHost + ":" + config.wssPort
    }],
    [":def", "wss_options", [":extend", ":ws_options", {
      encrypted: true
    }]],
    [":def", "http_options", {
      hostUnencrypted: config.httpHost + ":" + config.httpPort,
      hostEncrypted: config.httpHost + ":" + config.httpsPort,
      httpPath: config.httpPath
    }],
    [":def", "timeouts", {
      loop: true,
      timeout: 15000,
      timeoutLimit: 60000
    }],

    [":def", "ws_manager", [":transport_manager", {
      lives: 2,
      minPingDelay: 10000,
      maxPingDelay: config.activity_timeout
    }]],
    [":def", "streaming_manager", [":transport_manager", {
      lives: 2,
      minPingDelay: 10000,
      maxPingDelay: config.activity_timeout
    }]],

    [":def_transport", "ws", "ws", 3, ":ws_options", ":ws_manager"],
    [":def_transport", "wss", "ws", 3, ":wss_options", ":ws_manager"],
    [":def_transport", "xhr_streaming", "xhr_streaming", 1, ":http_options", ":streaming_manager"],
    [":def_transport", "xdr_streaming", "xdr_streaming", 1, ":http_options", ":streaming_manager"],
    [":def_transport", "xhr_polling", "xhr_polling", 1, ":http_options"],
    [":def_transport", "xdr_polling", "xdr_polling", 1, ":http_options"],

    [":def", "ws_loop", [":sequential", ":timeouts", ":ws"]],
    [":def", "wss_loop", [":sequential", ":timeouts", ":wss"]],

    [":def", "streaming_loop", [":sequential", ":timeouts",
      [":if", [":is_supported", ":xhr_streaming"],
        ":xhr_streaming",
        ":xdr_streaming"
      ]
    ]],
    [":def", "polling_loop", [":sequential", ":timeouts",
      [":if", [":is_supported", ":xhr_polling"],
        ":xhr_polling",
        ":xdr_polling"
      ]
    ]],

    [":def", "http_loop", [":if", [":is_supported", ":streaming_loop"], [
      ":best_connected_ever",
        ":streaming_loop",
        [":delayed", 4000, [":polling_loop"]]
    ], [
      ":polling_loop"
    ]]],

    [":def", "strategy",
      [":cached", 1800000,
        [":first_connected",
          [":if", [":is_supported", ":ws"],
            wsStrategy,
            ":http_loop"
          ]
        ]
      ]
    ]
  ];
};