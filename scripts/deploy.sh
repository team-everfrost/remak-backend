source ../.env
doppler run --token $DOPPLER_TOKEN -p remak -c prd -- pm2 reload ../ecosystem.json