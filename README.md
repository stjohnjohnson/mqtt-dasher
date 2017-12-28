# MQTT Dasher
***Emits events to MQTT when an Amazon Dash button is pressed.***

[![GitHub tag](https://img.shields.io/github/tag/stjohnjohnson/mqtt-dasher.svg)](https://github.com/stjohnjohnson/mqtt-dasher/releases)

# Configuration

The dash bridge has one yaml file for configuration:

```
---
mqtt:
    # Specify your MQTT Broker's hostname or IP address here
    host: mqtt
    # Preface for the topics $PREFACE/$TOPIC
    preface: dash

buttons:
    44:65:0d:dc:51:50: nerf_supplies

```

# Usage

_note: follow [this setup](https://github.com/hortinstein/node-dash-button#installation-instructions) first

1. Install the Node module globally

    ```
    $ npm install -g mqtt-dasher
    ```

2. Configure your buttons

    ```
    $ mkdir -p /opt/mqtt-dasher
    $ cp _config.yml /opt/mqtt-dasher/config.yml
    $ vi /opt/mqtt-dasher/config.yml
    ```

3. Add systemd unit for the service

    ```
    $ cp mqtt-dasher.service /etc/systemd/system
    ```

4. Run the server

    ```
    $ systemctl start mqtt-dasher.service
    ```

5. Configured dash events now feed into MQTT
