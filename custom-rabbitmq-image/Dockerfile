FROM rabbitmq:3.11-management

# Copy the plugin file into the container
COPY rabbitmq_delayed_message_exchange-3.11.1.ez $RABBITMQ_HOME/plugins/

# Set proper permissions and enable the plugin
RUN chown rabbitmq:rabbitmq $RABBITMQ_HOME/plugins/rabbitmq_delayed_message_exchange-*.ez && \
    rabbitmq-plugins enable --offline rabbitmq_delayed_message_exchange