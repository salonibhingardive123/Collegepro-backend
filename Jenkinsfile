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
                // Pulls your stored JSON credentials block into a temporary variable called AZURE_SP_JSON
                withCredentials([string(credentialsId: 'azure-service-principal', variable: 'AZURE_SP_JSON')]) {
                    echo 'Logging into Azure Account using automation credential token...'
                    // Authenticates using the raw JSON block text dynamically
                    sh "az login --sdk-auth --service-principal -u \$(echo \$AZURE_SP_JSON | jq -r .clientId) -p \$(echo \$AZURE_SP_JSON | jq -r .clientSecret) -t \$(echo \$AZURE_SP_JSON | jq -r .tenantId)"
                    
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
            '''emailext (
                subject: "SUCCESS: Jenkins Automation Pipeline [Job: ${env.JOB_NAME} Build: #${env.BUILD_NUMBER}]",
                body: "The book review system backend code was built, validated, and deployed successfully to Azure App Service. Review execution logs here: ${env.BUILD_URL}",
                to: "${env.ALERT_RECIPIENT}"
            )'''
        }

        failure {
            echo 'Exception trapped during workflow execution phase. Activating emergency alerts...'
            '''emailext (
                subject: "CRITICAL FAILURE: Jenkins Automation Pipeline [Job: ${env.JOB_NAME} Build: #${env.BUILD_NUMBER}]",
                body: "A pipeline operation encountered an exit failure. Broken configurations were blocked from changing live cloud assets. Review the terminal execution logs to debug: ${env.BUILD_URL}",
                to: "${env.ALERT_RECIPIENT}"
            )'''
        }
    }
}
