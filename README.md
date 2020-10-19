# Accessing Mobile Sensors over Web and Transmitting Real Time Data to Cloud Dashboard

## Overview

Long time back I was searching for a solution to showcase the IoT demo to few people using physical sensors, and by that mean I would have required a MicroController that supports Wifi/Ethernet, Sensors, Connections and all. I would have done that, but then this COVID-19 happened and all the things moved from Physical world to Virtual world. And, that's where this idea strike, that can we use the inbuilt sensors from people's smartphones, and BANG YES WE CAN. But, my another requirement was that I did not wanted people to install any app on their phones to be able to access their smartphone sensors. LUCKILY, there are some sensors in smartphones which can be accessed over Web and those sensors includes

- Ambient Light
- Accelerometer
- Gyroscope
- AbsoluteAcceleration
- MagnetoMeter
- etc.

There are 2 major components of this solution.

### 1. **Mobile Sensor App**

This is a Web App hosted on a Web App instance of Azure App Service Plan. This app is hosted on cloud and when you access this website/web app using a Android/iPhone on a Chrome Browser.

### 2. **Dashboard App**

This is another Web App hosted on a Web App instance of Azure App Service Plan. This app is hosted on cloud and displays a REAL-TIME sensor values from connected Mobile Sensors.
