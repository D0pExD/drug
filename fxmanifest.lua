fx_version 'cerulean'
game 'gta5'

author 'd0pe'
description 'Drug Lab System'
version '1.0.0'

shared_scripts {
    'config.lua'
}

client_scripts {
    'client.lua'
}

server_scripts {
    'server.lua'
}

ui_page 'web/index.html'

files {
    'web/**/*'
}

dependencies {
    'ox_target'
}