require 'aws-sdk-ec2'

EC2 = Aws::EC2::Resource.new

def handler(event:, context:)
  action = event['action']

  unless ['start', 'stop'].include?(action)
    raise "Invalid action: #{action}"
  end

  tag_filter = { name: 'tag:Environment', values: ["development", "staging"] }

  case action
  when 'start'
    EC2.instances(filters: [tag_filter, { name: 'instance-state-name', values: ['stopped'] }])
       .each { |instance| instance.start }
  when 'stop'
    EC2.instances(filters: [tag_filter, { name: 'instance-state-name', values: ['running'] }])
       .each { |instance| instance.stop }
  end

end