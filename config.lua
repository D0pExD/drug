Config = {}

-- Location
Config.LabLocation = vector3(904.9736, -3106.8342, 5.7122) -- Replace with your location you want
Config.LabInterior = {
    ipl = "meth_lab_production", -- Replace with your interir 
    coords = vector3(997.1072, -3199.9937, -36.3937),

    heading = 296.9684
}


-- Props
Config.LabProps = {
    {model = 'prop_table_03', offset = vector3(9.3295, 0.4935, -3.5994)},
    {model = 'prop_barrel_01a', offset = vector3(8.0295, 0.4935, -3.5994)},

    {model = 'prop_drug_burner', offset = vector3(9.3295, 0.4935, -2.7994)},
}

-- Minigame Settings
Config.Minigame = {
    Duration = 10, -- Duration of the minigame in seconds

    SafeZones = {
        Temperature = {min = 65, max = 80},


        Pressure = {min = 40, max = 60}
    },
    CriticalLevels = {
        
        Pressure = 90,
        Temperature = 20
    }
}

-- Rewards
Config.Reward = {
    Item = 'meth_bag',
    Amount = 1
}

-- Cooldown
Config.Cooldown = 0 -- minutes

-- Police Alert
Config.PoliceAlertThreshold = 3 -- number of failures before alert

-- Constants
Config.Constants = {
    POLICE_ALERT_COOLDOWN = 30000, -- 30 seconds in ms - police alert cooldown so it doesn't spam the dispatch again and again
    DAMAGE_INTERVAL = 1000, -- 1 second in ms
    DAMAGE_AMOUNT = 10, -- gas damage amount
    EXPLOSION_DAMAGE = 50, 
    DEBUG = true -- Set to true to enable debug prints , also disables cooldown check as its stored in clients kvp to prevent exploits
}