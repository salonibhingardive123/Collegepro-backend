pipeline {
    agent any

    environment {
        // Sensitive identifiers are safely abstracted into Jenkins Credentials mapping
        AZURE_SUBSCRIPTION_ID = credentials('AZURE_SUBSCRIPTION_ID_SECRET')
        AZURE_RESOURCE_GROUP  = credentials('AZURE_RESOURCE_GROUP_SECRET')
        AZURE_WEBAPP_NAME     = credentials('AZURE_WEBAPP_NAME_SECRET')
        AZURE_CREDENTIALS_ID  = 'azure-service-principal'
        ALERT_RECIPIENT       = 'developer-team@college.edu'
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
                echo 'Authenticating pipeline secure context using Azure Service Principal...'
                withCredentials([azureServicePrincipal(AZURE_CREDENTIALS_ID)]) {
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
            emailext (
                subject: "SUCCESS: Jenkins Automation Pipeline [Job: ${env.JOB_NAME} Build: #${env.BUILD_NUMBER}]",
                body: "The book review system backend code was built, validated, and deployed successfully to Azure App Service. Review execution logs here: ${env.BUILD_URL}",
                to: "${env.ALERT_RECIPIENT}"
            )
        }

        failure {
            echo 'Exception trapped during workflow execution phase. Activating emergency alerts...'
            emailext (
                subject: "CRITICAL FAILURE: Jenkins Automation Pipeline [Job: ${env.JOB_NAME} Build: #${env.BUILD_NUMBER}]",
                body: "A pipeline operation encountered an exit failure. Broken configurations were blocked from changing live cloud assets. Review the terminal execution logs to debug: ${env.BUILD_URL}",
                to: "${env.ALERT_RECIPIENT}"
            )
        }
    }
}
