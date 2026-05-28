pipeline {
    agent any

    environment {
        // Abstracting sensitive variables from the Jenkins Store
        AZURE_SUBSCRIPTION_ID = credentials('AZURE_SUBSCRIPTION_ID_SECRET')
        AZURE_RESOURCE_GROUP  = credentials('AZURE_RESOURCE_GROUP_SECRET')
        AZURE_WEBAPP_NAME     = credentials('AZURE_WEBAPP_NAME_SECRET')
        ALERT_RECIPIENT       = 'salonibhingardive.579@gmail.com'
    }

    stages {
        stage('Pull Repository Code') {
            steps {
                echo 'Pulling backend application files from GitHub repository...'
                checkout scm
            }
        }

        stage('Verify Node Environment') {
            steps {
                echo 'Verifying engine dependencies and installing source modules...'
                sh 'npm install'
            }
        }

        stage('Package Application') {
            steps {
                echo 'Compressing backend source folder into standard deployment zip package...'
                sh 'zip -r backend-deploy.zip server.js db.js package.json node_modules'
            }
        }

        stage('Deploy to Azure App Service') {
            steps {
                echo 'Authenticating pipeline secure context using Service Principal JSON Secret Text...'
                withCredentials([string(credentialsId: 'azure-service-principal', variable: 'AZURE_SP_JSON')]) {
                    echo 'Logging into Azure Account using automation credential token...'
                    // Uses clean standard keys compatible with all modern Azure CLI versions
                    sh """
                        CLIENT_ID=\$(echo \$AZURE_SP_JSON | jq -r .clientId)
                        CLIENT_SECRET=\$(echo \$AZURE_SP_JSON | jq -r .clientSecret)
                        TENANT_ID=\$(echo \$AZURE_SP_JSON | jq -r .tenantId)
                        
                        az login --service-principal -u \$CLIENT_ID -p \$CLIENT_SECRET -t \$TENANT_ID
                    """
                    
                    echo 'Publishing verified zip package directly to production app container slot...'
                    sh "az account set --subscription ${AZURE_SUBSCRIPTION_ID}"
                    sh "az webapp deployment source config-zip --name ${AZURE_WEBAPP_NAME} --resource-group ${AZURE_RESOURCE_GROUP} --src backend-deploy.zip"
                }
            }
        }
    }

    post {
        success {
            echo 'Deployment operations completed cleanly. Dispatching notification email...'
            
        }

        failure {
            echo 'Exception trapped during workflow execution phase. Activating emergency alerts...'
            
        }
    }
}
